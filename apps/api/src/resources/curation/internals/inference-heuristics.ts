import { DOMAIN_RULES } from '../../config/domain-rules';

export interface InferredPublisher {
  slug: string;
  name: string;
}

export interface InferredSeries {
  slug: string;
  name: string;
}

export class InferenceHeuristics {
  inferPublisher(
    title: string,
    description: string,
    url: string,
  ): InferredPublisher | null {
    const normalizedHost = this.extractHost(url);

    const matchedRule = DOMAIN_RULES.find((rule) =>
      rule.hosts.includes(normalizedHost),
    );

    if (matchedRule?.publisher) {
      return matchedRule.publisher;
    }

    const haystack = `${title} ${description} ${url}`.toLowerCase();

    if (
      haystack.includes('radio lingua') ||
      haystack.includes('one minute ') ||
      haystack.includes('coffee break ')
    ) {
      return {
        slug: 'radio-lingua-network',
        name: 'Radio Lingua Network',
      };
    }

    if (
      haystack.includes('arirang') ||
      haystack.includes('learnkorean_arirang')
    ) {
      return {
        slug: 'arirang-tv',
        name: 'Arirang TV',
      };
    }

    if (haystack.includes('bbc')) {
      return {
        slug: 'bbc',
        name: 'BBC',
      };
    }

    if (haystack.includes('dalarna university')) {
      return {
        slug: 'dalarna-university',
        name: 'Dalarna University',
      };
    }

    if (haystack.includes('japan foundation')) {
      return {
        slug: 'japan-foundation',
        name: 'Japan Foundation',
      };
    }

    if (
      haystack.includes("master's seminary") ||
      haystack.includes('masters seminary')
    ) {
      return {
        slug: 'the-masters-seminary',
        name: "The Master's Seminary",
      };
    }

    return null;
  }

  inferSeries(title: string, description: string): InferredSeries | null {
    const haystack = `${title} ${description}`.toLowerCase();

    const exactSeries = [
      'One Minute',
      'Coffee Break',
      "Let's Speak Korean",
      'Biblical Hebrew Grammar',
      'The London Latin Course',
      'Connect with English',
      'HindiPod 101',
    ];

    for (const name of exactSeries) {
      if (haystack.includes(name.toLowerCase())) {
        return {
          slug: this.slugify(name),
          name,
        };
      }
    }

    if (/season\s*\d+/i.test(title) && /let'?s speak korean/i.test(title)) {
      return {
        slug: 'lets-speak-korean',
        name: "Let's Speak Korean",
      };
    }

    return null;
  }

  private extractHost(urlValue: string): string {
    try {
      const url = new URL(urlValue);
      return url.hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  }

  private slugify(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/['’]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
