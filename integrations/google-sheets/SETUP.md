# Google Sheets registration connection

The registration API appends rows to the private `Technotsav Registration` spreadsheet. It reads the first row of the configured tab and maps fields by header text, so keep the sheet's header row intact.

## Configure Vercel

1. In Google Cloud Console, create or select a project and enable the **Google Sheets API**.
2. Create a service account and create a JSON key for it. You do not need to grant the service account broad project roles.
3. Open the JSON key locally and copy its full contents. In Vercel, open the Technotsav project → **Settings → Environment Variables** and add:

   - `GOOGLE_SERVICE_ACCOUNT_JSON`: paste the entire JSON key as the value.
   - `GOOGLE_SHEETS_SPREADSHEET_ID`: `10ySKpqkk_ioUeUpqUF1V-3NM6eTJ3VhvVvlR4bZn0iI`
   - `GOOGLE_SHEETS_TAB_NAME`: `Sheet1`

4. In the Google Sheet's **Share** dialog, add the `client_email` value from the JSON key as an **Editor**. The spreadsheet stays private; only that service account gets access.
5. Save the variables for the production environment and redeploy the latest deployment. Add Preview too only if you want preview deployments to accept registrations.

Keep `GOOGLE_SERVICE_ACCOUNT_JSON` server-side: do not use a `NEXT_PUBLIC_` prefix, put it in source control, or send the key in chat. The spreadsheet ID and tab name are identifiers, not credentials.

## Local development

For local testing, put the same three variables in `.env.local` (ignored by Git). The complete JSON key is the value of `GOOGLE_SERVICE_ACCOUNT_JSON`.

The API requires headers in row 1 that identify the fields used by the form: timestamp, college name, group/individual type, event, and the mode-specific participant/contact fields. Optional CL fields are written when matching CL headers exist. For group submissions it also requires group name, participant names, group leader WhatsApp, alternate WhatsApp, and group leader email. The API returns a configuration error instead of appending a misaligned row if a required header cannot be matched.
