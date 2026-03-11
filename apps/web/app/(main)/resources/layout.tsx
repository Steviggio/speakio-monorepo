import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Resources Directory',
  description: 'Discover and vote on the best community-curated language learning tools and materials.',
};

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
