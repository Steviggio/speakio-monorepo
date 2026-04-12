import { Injectable } from '@nestjs/common';
import { DOMAIN_RULES } from '../config/domain-rules';

type NormalizedUrlMeta = {
  canonicalUrl: string;
  sourcePlatform: {
    domain: string;
    rootDomain: string;
    baseUrl: string;
    label: string;
  };
};

@Injectable()
export class ResourceNormalizerService {
  normalizeUrl(rawUrl: string): NormalizedUrlMeta {
    const canonicalUrl = this.buildCanonicalUrl(rawUrl);
    const url = new URL(canonicalUrl);

    const domain = url.hostname.replace(/^www\./, '');
    const rule = DOMAIN_RULES.find((item) => item.hosts.includes(domain));

    const rootDomain =
      rule?.rootDomainOverride ?? this.extractRootDomain(domain);

    const label =
      rule?.platformLabel ??
      this.buildFriendlyPlatformLabel(domain, rootDomain);

    return {
      canonicalUrl,
      sourcePlatform: {
        domain,
        rootDomain,
        baseUrl: `https://${domain}`,
        label,
      },
    };
  }

  buildCanonicalUrl(rawUrl: string): string {
    const url = new URL(rawUrl.trim());

    url.protocol = 'https:';

    if (url.hostname.startsWith('www.')) {
      url.hostname = url.hostname.replace(/^www\./, '');
    }

    url.hash = '';

    if (url.pathname !== '/' && url.pathname.endsWith('/')) {
      url.pathname = url.pathname.slice(0, -1);
    }

    const trackingParams = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'fbclid',
      'gclid',
    ];

    trackingParams.forEach((param) => {
      url.searchParams.delete(param);
    });

    const sortedParams = [...url.searchParams.entries()].sort(([a], [b]) =>
      a.localeCompare(b),
    );

    url.search = '';

    for (const [key, value] of sortedParams) {
      url.searchParams.append(key, value);
    }

    return url.toString();
  }

  private extractRootDomain(host: string): string {
    const parts = host.split('.').filter(Boolean);

    if (parts.length <= 2) {
      return host;
    }

    const compoundSuffixes = new Set([
      'co.uk',
      'org.uk',
      'gov.uk',
      'ac.uk',
      'com.au',
      'net.au',
      'org.au',
      'co.jp',
      'com.br',
    ]);

    const lastTwo = parts.slice(-2).join('.');
    const lastThree = parts.slice(-3).join('.');

    if (compoundSuffixes.has(lastTwo)) {
      return lastThree;
    }

    return lastTwo;
  }

  private buildFriendlyPlatformLabel(
    domain: string,
    rootDomain: string,
  ): string {
    const source = domain === rootDomain ? rootDomain : domain;
    const firstSegment = source.split('.')[0];

    return firstSegment
      .split('-')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
