import { ResourceItem } from "@/lib/api/resources";

export interface DomainGroup {
  domain: string;
  label: string;
  resources: ResourceItem[];
}

export function extractRootDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    const parts = hostname.split(".");
    if (parts.length >= 2) {
      return parts.slice(-2).join(".");
    }
    return hostname;
  } catch {
    return "other";
  }
}

export function domainToLabel(domain: string): string {
  const known: Record<string, string> = {
    "youtube.com": "YouTube",
    "spotify.com": "Spotify",
    "facebook.com": "Facebook",
    "wikipedia.org": "Wikipedia",
    "wikibooks.org": "Wikibooks",
    "gutenberg.org": "Project Gutenberg",
    "archive.org": "Internet Archive",
    "reddit.com": "Reddit",
    "github.com": "GitHub",
  };
  return known[domain] || domain;
}

export function groupByDomain(resources: ResourceItem[]): DomainGroup[] {
  const map = new Map<string, DomainGroup>();

  for (const r of resources) {
    const domain = r.sourcePlatform?.rootDomain || extractRootDomain(r.url);
    const label = r.sourcePlatform?.label || domainToLabel(domain);

    if (!map.has(domain)) {
      map.set(domain, { domain, label, resources: [] });
    }
    map.get(domain)!.resources.push(r);
  }

  return Array.from(map.values()).sort((a, b) => {
    if (b.resources.length !== a.resources.length) {
      return b.resources.length - a.resources.length;
    }
    return a.label.localeCompare(b.label);
  });
}

export function formatLanguageLabel(lang: string): string {
  if (!lang) return lang;
  if (lang === "multi") return "Multilingual";

  const isIsoCode = /^[a-z]{2,3}(-[A-Z]{2})?$/.test(lang);
  
  if (isIsoCode) {
    try {
      
      const languageNames = new Intl.DisplayNames(undefined, { type: 'language' });
      const fullName = languageNames.of(lang);
      if (fullName && fullName !== lang) {
        return fullName.charAt(0).toUpperCase() + fullName.slice(1);
      }
    } catch (e) {
      
    }
  }

  return lang
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function formatTypeLabel(type: string, t: (key: string) => string): string {
  return t(`resources.types.${type}`) || type;
}

export function formatPricingLabel(pricing: string, t: (key: string) => string): string {
  return t(`resources.pricing.${pricing}`) || pricing;
}

