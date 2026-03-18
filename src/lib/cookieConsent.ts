const KEY = "decoder_cookie_consent";
const VERSION = 1;
const EXPIRY_DAYS = 365;

export interface ConsentPreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export interface ConsentRecord extends ConsentPreferences {
  version: number;
  timestamp: string;
}

export interface CookieCategory {
  id: keyof ConsentPreferences;
  required: boolean;
  label: string;
  description: string;
  cookies: { name: string; purpose: string; duration: string }[];
}

export const CATEGORIES: CookieCategory[] = [
  {
    id: "necessary",
    required: true,
    label: "Necessary",
    description: "Essential for the site to function. Cannot be disabled.",
    cookies: [
      { name: "decoder_cookie_consent", purpose: "Stores your cookie consent preferences", duration: "12 months" },
    ],
  },
  {
    id: "analytics",
    required: false,
    label: "Analytics",
    description: "Help us understand how you use the site so we can improve it (e.g. Google Analytics).",
    cookies: [
      { name: "_ga", purpose: "Google Analytics — distinguishes unique users", duration: "2 years" },
      { name: "_gid", purpose: "Google Analytics — session tracking", duration: "24 hours" },
    ],
  },
  {
    id: "marketing",
    required: false,
    label: "Marketing",
    description: "Allow us to show you relevant ads on other platforms.",
    cookies: [
      { name: "_fbp", purpose: "Meta Pixel — ad conversion tracking", duration: "3 months" },
    ],
  },
];

export const DEFAULT_CONSENT: ConsentPreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
};

export function getConsent(): ConsentRecord | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data: ConsentRecord = JSON.parse(raw);
    if (data.version !== VERSION) return null;
    const age = Date.now() - new Date(data.timestamp).getTime();
    if (age > EXPIRY_DAYS * 24 * 60 * 60 * 1000) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveConsent(preferences: Partial<ConsentPreferences>): ConsentRecord {
  const data: ConsentRecord = {
    version: VERSION,
    timestamp: new Date().toISOString(),
    necessary: true,
    analytics: !!preferences.analytics,
    marketing: !!preferences.marketing,
  };
  localStorage.setItem(KEY, JSON.stringify(data));
  return data;
}

export function clearConsent(): void {
  localStorage.removeItem(KEY);
}

export function hasConsent(category: keyof ConsentPreferences): boolean {
  const consent = getConsent();
  if (!consent) return false;
  return !!consent[category];
}
