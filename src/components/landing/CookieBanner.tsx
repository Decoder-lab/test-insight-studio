import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Cookie } from "lucide-react";
import { getConsent, saveConsent, clearConsent, CATEGORIES, DEFAULT_CONSENT, type ConsentPreferences } from "@/lib/cookieConsent";

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [prefs, setPrefs] = useState<ConsentPreferences>(DEFAULT_CONSENT);

  useEffect(() => {
    if (!getConsent()) setVisible(true);
  }, []);

  const accept = (preferences: Partial<ConsentPreferences>) => {
    saveConsent(preferences);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
    >
      <div className="bg-card border border-border rounded-2xl max-w-3xl mx-auto p-6 shadow-2xl">
        <div className="flex items-start gap-3 mb-4">
          <Cookie className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div>
            <h2 className="font-display font-bold text-base mb-1">We use cookies</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We use cookies to improve your experience and, with your consent, for analytics and
              marketing. See our{" "}
              <Link to="/privacy-policy" target="_blank" className="text-accent underline underline-offset-2 hover:text-accent/80">
                Privacy Policy
              </Link>{" "}
              for details.
            </p>
          </div>
        </div>

        {expanded && (
          <div className="mb-4 space-y-4 border-t border-border pt-4">
            {CATEGORIES.map((cat) => (
              <div key={cat.id} className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground mb-0.5">{cat.label}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{cat.description}</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">
                    {cat.cookies.map((c) => c.name).join(", ")}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <button
                    role="switch"
                    aria-checked={cat.required ? true : prefs[cat.id]}
                    aria-label={`${cat.label} cookies`}
                    disabled={cat.required}
                    onClick={() => !cat.required && setPrefs((p) => ({ ...p, [cat.id]: !p[cat.id] }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent shrink-0
                      ${cat.required ? "bg-accent/40 cursor-not-allowed" : prefs[cat.id] ? "bg-accent cursor-pointer" : "bg-muted border border-border cursor-pointer"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${(cat.required || prefs[cat.id]) ? "translate-x-6" : "translate-x-1"}`}
                    />
                  </button>
                  {cat.required && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">Always on</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-2">
          <button
            onClick={() => accept({ analytics: true, marketing: true })}
            className="rounded-full bg-accent text-accent-foreground font-semibold text-sm px-5 py-2.5 min-h-[44px] hover:brightness-110 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Accept all
          </button>
          <button
            onClick={() => accept({ analytics: false, marketing: false })}
            className="rounded-full border border-border text-foreground font-semibold text-sm px-5 py-2.5 min-h-[44px] hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Reject all
          </button>
          {expanded ? (
            <button
              onClick={() => accept(prefs)}
              className="rounded-full border border-accent text-accent font-semibold text-sm px-5 py-2.5 min-h-[44px] hover:bg-accent/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Save preferences
            </button>
          ) : (
            <button
              onClick={() => setExpanded(true)}
              className="rounded-full border border-border text-muted-foreground font-semibold text-sm px-5 py-2.5 min-h-[44px] hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Customize
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
