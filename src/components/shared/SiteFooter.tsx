import { FESTIVAL_DETAILS } from "@/lib/festival";

type SiteFooterProps = {
  variant?: "default" | "portal";
};

export function SiteFooter({ variant = "default" }: SiteFooterProps) {
  return (
    <footer className={`site-footer site-footer--${variant}`} aria-label="Technotsav contact information">
      <div className="site-footer-heading">
        <p>Technotsav 2026–27 <span>·</span> Space × AI</p>
        <span>Decoding Infinity. Defining Tomorrow.</span>
      </div>
      <div className="site-footer-details">
        <div className="site-footer-detail site-footer-college">
          <span className="site-footer-label">Presented by</span>
          <strong>{FESTIVAL_DETAILS.college}</strong>
        </div>
        <div className="site-footer-detail">
          <span className="site-footer-label">Venue</span>
          <strong>{FESTIVAL_DETAILS.venue}</strong>
        </div>
        <div className="site-footer-detail">
          <span className="site-footer-label">Email</span>
          <a href={`mailto:${FESTIVAL_DETAILS.email}`}>{FESTIVAL_DETAILS.email}</a>
        </div>
        <div className="site-footer-detail">
          <span className="site-footer-label">Instagram</span>
          <a href={FESTIVAL_DETAILS.officialInstagramUrl} target="_blank" rel="noreferrer">@nmfc_official</a>
          <a href={`https://www.instagram.com/${FESTIVAL_DETAILS.instagram}/`} target="_blank" rel="noreferrer">@{FESTIVAL_DETAILS.instagram}</a>
        </div>
        <div className="site-footer-detail">
          <span className="site-footer-label">Website</span>
          <a href={`https://${FESTIVAL_DETAILS.website}/`} target="_blank" rel="noreferrer">{FESTIVAL_DETAILS.website}</a>
        </div>
      </div>
    </footer>
  );
}
