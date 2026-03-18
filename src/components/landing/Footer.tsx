import { Link } from "react-router-dom";
import { clearConsent } from "@/lib/cookieConsent";

interface FooterProps {
  onCookieSettings?: () => void;
}

const Footer = ({ onCookieSettings }: FooterProps) => (
  <footer className="bg-surface-dark text-surface-dark-foreground py-12 border-t border-border/20">
    <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-accent rounded-md flex items-center justify-center">
          <span className="font-display font-bold text-accent-foreground text-xs">D</span>
        </div>
        <span className="font-display font-semibold">Decoder MVP</span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-surface-dark-muted">
        <Link to="/privacy-policy" className="hover:text-surface-dark-foreground transition-colors underline underline-offset-2">
          Privacy Policy
        </Link>
        <button
          onClick={onCookieSettings}
          className="hover:text-surface-dark-foreground transition-colors underline underline-offset-2"
        >
          Cookie Settings
        </button>
        <span>© {new Date().getFullYear()} Decoder. All rights reserved.</span>
      </div>
    </div>
  </footer>
);

export default Footer;
