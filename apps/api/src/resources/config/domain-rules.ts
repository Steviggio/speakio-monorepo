export interface DomainRule {
  hosts: string[];
  rootDomainOverride?: string;
  platformLabel?: string;
  publisher?: {
    slug: string;
    name: string;
  };
}

export const DOMAIN_RULES: DomainRule[] = [
  {
    hosts: ['youtube.com', 'm.youtube.com'],
    rootDomainOverride: 'youtube.com',
    platformLabel: 'YouTube',
  },
  {
    hosts: ['podcasts.apple.com', 'itunes.apple.com'],
    rootDomainOverride: 'apple.com',
    platformLabel: 'Apple',
  },
  {
    hosts: ['fsi-languages.yojik.eu'],
    rootDomainOverride: 'yojik.eu',
    platformLabel: 'FSI Languages',
  },
  {
    hosts: [
      'didierfle-edito.com',
      'didierlatitudes.com',
      'didierfle-latelier.fr',
      'didierfle-bonjourbienvenue.fr',
      'didierfle-saison.com',
    ],
    publisher: {
      slug: 'didier-fle',
      name: 'Didier-FLE',
    },
  },
];
