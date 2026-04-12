import OnboardingWizard from '@/components/onboarding/OnboardingWizard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Setup your profile',
  description: 'Tell us what you want to learn so we can personalize your experience.',
};

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl p-8 md:p-12">
        <h1 className="text-3xl font-bold text-center mb-2">Welcome to Speakio!</h1>
        <p className="text-slate-500 text-center mb-8">Let's tailor your learning experience.</p>
        
        <OnboardingWizard />
      </div>
    </div>
  );
}
