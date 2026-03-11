import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Roadmaps',
  description: 'Manage, track, and complete your personalized language learning journey roadmaps.',
};

export default function RoadmapsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
