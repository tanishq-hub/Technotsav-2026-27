import { createSign } from "node:crypto";
import { NextResponse } from "next/server";
import { GROUP_REGISTRATION_EVENTS, INDIVIDUAL_REGISTRATION_EVENTS } from "@/lib/registration";

type Payload = Record<string, unknown>;
type ServiceAccount = { client_email?: string; private_key?: string; token_uri?: string };
type SheetField = "timestamp" | "collegeName" | "classRepName" | "classRepPhone" | "registrationType" | "eventName" | "groupName" | "participants" | "participantName" | "leaderPhone" | "alternatePhone" | "leaderEmail" | "participantPhone";

let cachedAccessToken: { token: string; expiresAt: number } | undefined;
let ongoingTokenFetch: Promise<string> | null = null;

// Rate limiting: max 10 submissions per minute per client IP
const ipRateLimits = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 10;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = ipRateLimits.get(ip);
  if (!record || now > record.resetTime) {
    ipRateLimits.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    if (ipRateLimits.size > 500) {
      for (const [key, value] of ipRateLimits.entries()) {
        if (now > value.resetTime) ipRateLimits.delete(key);
      }
    }
    return false;
  }
  if (record.count >= MAX_REQUESTS_PER_WINDOW) return true;
  record.count += 1;
  return false;
}

const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
// Supports standard Indian mobile numbers with optional +91, 91, or leading 0 trunk prefix
const validPhone = (value: string) => /^[6-9]\d{9}$/.test(value.replace(/^(?:\+?91|0)[\s-]*/, "").replace(/[\s-]/g, ""));
const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

// Protect against spreadsheet formula injection (leading =, +, -, @, \t, \r)
function sanitizeForSheet(value: string): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (/^[=+\-@\t\r]/.test(trimmed)) {
    return `'${trimmed}`;
  }
  return trimmed;
}

function badRequest(message: string) {
  return NextResponse.json({ message }, { status: 400 });
}

function normalizeHeader(header: string) {
  return header.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function findHeader(headers: string[], predicate: (header: string) => boolean) {
  return headers.findIndex((header) => predicate(normalizeHeader(header)));
}

function fieldColumns(headers: string[], registrationType: "group" | "individual"): Partial<Record<SheetField, number>> {
  const by = (predicate: (header: string) => boolean) => findHeader(headers, predicate);
  const columns: Partial<Record<SheetField, number>> = {
    timestamp: by((header) => header === "timestamp" || header.includes("submitted at")),
    collegeName: by((header) => header.includes("college") && header.includes("name")),
    classRepName: by((header) => header.includes("cl") && header.includes("name") && !header.includes("phone") && !header.includes("whatsapp")),
    classRepPhone: by((header) => header.includes("cl") && (header.includes("phone") || header.includes("whatsapp") || header.includes("mobile"))),
    registrationType: by((header) => header.includes("group") && header.includes("individual") && !header.includes("event")),
    groupName: by((header) => header.includes("group name")),
    participants: by((header) => header.includes("participants") && !header.includes("phone")),
    participantName: by((header) => header.includes("participant") && !header.includes("participants") && !header.includes("phone")),
    leaderPhone: by((header) => header.includes("group leader") && (header.includes("phone") || header.includes("whatsapp") || header.includes("mobile")) && !header.includes("alternate")),
    alternatePhone: by((header) => header.includes("alternate") && (header.includes("phone") || header.includes("whatsapp") || header.includes("mobile"))),
    leaderEmail: by((header) => header.includes("group leader") && header.includes("email")),
    participantPhone: by((header) => header.includes("phone") || header.includes("whatsapp") || header.includes("mobile")),
  };

  // Prefer the mode-specific event column when the Sheet has separate group and individual columns.
  const modeEventColumn = by((header) => header.includes(registrationType) && header.includes("event"));
  columns.eventName = modeEventColumn >= 0
    ? modeEventColumn
    : by((header) => header.includes("event name") || header === "event" || header === "events");

  // Do not mistake class-representative or group-leader contact columns for the individual contact.
  const participantPhoneColumn = columns.participantPhone;
  if (participantPhoneColumn !== undefined && participantPhoneColumn >= 0) {
    const candidate = normalizeHeader(headers[participantPhoneColumn]);
    if (candidate.includes("cl") || candidate.includes("group") || candidate.includes("leader") || candidate.includes("alternate")) {
      columns.participantPhone = by((header) => (header.includes("phone") || header.includes("whatsapp") || header.includes("mobile")) && !header.includes("cl") && !header.includes("group") && !header.includes("leader") && !header.includes("alternate"));
    }
  }
  return Object.fromEntries(Object.entries(columns).filter(([, index]) => typeof index === "number" && index >= 0)) as Partial<Record<SheetField, number>>;
}

function requiredSheetFields(type: "group" | "individual"): SheetField[] {
  return type === "group"
    ? ["timestamp", "collegeName", "registrationType", "eventName", "groupName", "participants", "leaderPhone", "alternatePhone", "leaderEmail"]
    : ["timestamp", "collegeName", "registrationType", "eventName", "participantName", "participantPhone"];
}

async function getAccessToken() {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) return cachedAccessToken.token;
  if (ongoingTokenFetch) return ongoingTokenFetch;

  ongoingTokenFetch = (async () => {
    try {
      const rawAccount = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
      if (!rawAccount) throw new Error("Missing Google service account credentials");

      let account: ServiceAccount;
      try {
        account = JSON.parse(rawAccount) as ServiceAccount;
      } catch {
        throw new Error("Google service account credentials are not valid JSON");
      }
      if (!account.client_email || !account.private_key) throw new Error("Google service account credentials are incomplete");

      const tokenUrl = account.token_uri || "https://oauth2.googleapis.com/token";
      const issuedAt = Math.floor(Date.now() / 1000);
      const jwtHeader = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
      const jwtClaims = Buffer.from(JSON.stringify({
        iss: account.client_email,
        scope: "https://www.googleapis.com/auth/spreadsheets",
        aud: tokenUrl,
        iat: issuedAt,
        exp: issuedAt + 3600,
      })).toString("base64url");
      const unsignedToken = `${jwtHeader}.${jwtClaims}`;
      const signer = createSign("RSA-SHA256");
      signer.update(unsignedToken);
      signer.end();
      const assertion = `${unsignedToken}.${signer.sign(account.private_key.replace(/\\n/g, "\n"), "base64url")}`;
      const tokenResponse = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
        cache: "no-store",
        signal: AbortSignal.timeout(12_000),
      });
      const tokenResult = await tokenResponse.json() as { access_token?: string; expires_in?: number };
      if (!tokenResponse.ok || !tokenResult.access_token) throw new Error("Google did not authorize the service account");
      cachedAccessToken = { token: tokenResult.access_token, expiresAt: Date.now() + (tokenResult.expires_in ?? 3600) * 1000 };
      return cachedAccessToken.token;
    } finally {
      ongoingTokenFetch = null;
    }
  })();

  return ongoingTokenFetch;
}

function escapedTabName(tabName: string) {
  return `'${tabName.replace(/'/g, "''")}'`;
}

async function appendRegistrationRow(values: Partial<Record<SheetField, string>>, type: "group" | "individual") {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const tabName = process.env.GOOGLE_SHEETS_TAB_NAME || "Sheet1";
  if (!spreadsheetId) throw new Error("Missing spreadsheet ID");

  const token = await getAccessToken();
  const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values`;
  const headerRange = `${escapedTabName(tabName)}!1:1`;
  const headerResponse = await fetch(`${baseUrl}/${encodeURIComponent(headerRange)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  const headerResult = await headerResponse.json() as { values?: string[][] };
  if (!headerResponse.ok) throw new Error("Unable to read the registration sheet header row");
  const headers = (headerResult.values?.[0] ?? []).map((header) => String(header));
  const columns = fieldColumns(headers, type);
  const missing = requiredSheetFields(type).filter((field) => columns[field] === undefined);
  if (values.classRepName && columns.classRepName === undefined) missing.push("classRepName");
  if (values.classRepPhone && columns.classRepPhone === undefined) missing.push("classRepPhone");
  if (missing.length) throw new Error(`Registration sheet headers are missing fields: ${missing.join(", ")}`);

  const row = Array.from({ length: headers.length }, () => "");
  for (const [field, value] of Object.entries(values) as [SheetField, string][]) {
    const index = columns[field];
    if (index !== undefined) row[index] = sanitizeForSheet(value);
  }
  const appendRange = `${escapedTabName(tabName)}!A:ZZ`;
  const appendUrl = new URL(`${baseUrl}/${encodeURIComponent(appendRange)}:append`);
  appendUrl.searchParams.set("valueInputOption", "RAW");
  appendUrl.searchParams.set("insertDataOption", "INSERT_ROWS");
  const appendResponse = await fetch(appendUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ values: [row] }),
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  if (!appendResponse.ok) throw new Error("Google Sheets rejected the registration row");
}

export async function POST(request: Request) {
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite === "cross-site") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ message: "This request could not be accepted." }, { status: 403 });
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { message: "Too many registration attempts. Please wait a minute before trying again." },
      { status: 429 }
    );
  }

  let data: Payload;
  try {
    data = await request.json() as Payload;
  } catch {
    return badRequest("The registration details were not readable. Please review the form and try again.");
  }

  // Silently accept automated form fills without forwarding them to the Sheet.
  if (text(data.companyWebsite)) return NextResponse.json({ message: "Registration received. Thank you!" });

  const registrationType = text(data.registrationType);
  const collegeName = text(data.collegeName);
  const classRepName = text(data.classRepName);
  const classRepPhone = text(data.classRepPhone);
  if (collegeName.length < 2 || collegeName.length > 120) return badRequest("Enter a valid college name.");
  if (classRepName.length > 100) return badRequest("The CL name is too long.");
  if (classRepPhone && !validPhone(classRepPhone)) return badRequest("Enter a valid CL WhatsApp number.");

  let eventName: string;
  let registration: Partial<Record<SheetField, string>>;
  if (registrationType === "group") {
    const eventId = text(data.eventId);
    const event = GROUP_REGISTRATION_EVENTS.find((candidate) => candidate.id === eventId);
    const groupName = text(data.groupName);
    const participants = Array.isArray(data.participants) ? data.participants.map(text).filter(Boolean) : [];
    const leaderPhone = text(data.leaderPhone);
    const alternatePhone = text(data.alternatePhone);
    const leaderEmail = text(data.leaderEmail);
    if (!event) return badRequest("Choose a valid group event.");
    if (groupName.length < 2 || groupName.length > 80) return badRequest("Enter a valid group name.");
    if (participants.length < event.min || participants.length > event.max || participants.some((name) => name.length > 100)) {
      return badRequest(`Enter ${event.min === event.max ? `exactly ${event.max}` : `${event.min} to ${event.max}`} participant names for this event.`);
    }
    if (!validPhone(leaderPhone) || !validPhone(alternatePhone)) return badRequest("Enter valid Indian mobile numbers for both WhatsApp contacts.");
    if (!validEmail(leaderEmail) || leaderEmail.length > 254) return badRequest("Enter a valid group leader email address.");
    eventName = event.label;
    registration = { groupName, participants: participants.join("\n"), leaderPhone, alternatePhone, leaderEmail };
  } else if (registrationType === "individual") {
    const eventId = text(data.eventId);
    const individualEvent = INDIVIDUAL_REGISTRATION_EVENTS.find((candidate) => candidate.id === eventId);
    const participantName = text(data.participantName);
    const participantPhone = text(data.participantPhone);
    if (!individualEvent) return badRequest("Choose a valid individual event.");
    if (participantName.length < 2 || participantName.length > 100) return badRequest("Enter a valid participant name.");
    if (!validPhone(participantPhone)) return badRequest("Enter a valid Indian mobile number.");
    eventName = individualEvent.label;
    registration = { participantName, participantPhone };
  } else {
    return badRequest("Choose Group or Individual registration.");
  }

  const values: Partial<Record<SheetField, string>> = {
    timestamp: new Date(Date.now() + 330 * 60_000).toISOString().replace("Z", "+05:30"),
    collegeName,
    classRepName,
    classRepPhone,
    registrationType: registrationType === "group" ? "Group" : "Individual",
    eventName,
    ...registration,
  };

  try {
    await appendRegistrationRow(values, registrationType);
    return NextResponse.json({ message: "Registration received. Thank you!" });
  } catch (error) {
    console.error("Registration sheet append failed", error);
    return NextResponse.json({ message: "We could not save your registration just now. Please check the Sheet connection and try again." }, { status: 503 });
  }
}
