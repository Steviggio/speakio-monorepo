'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import Cookies from 'js-cookie';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' }
];

const levels = [
  { id: 'A1', name: 'Beginner (A1)', desc: 'I can understand basic phrases.' },
  { id: 'A2', name: 'Elementary (A2)', desc: 'I can communicate in simple tasks.' },
  { id: 'B1', name: 'Intermediate (B1)', desc: 'I can deal with most situations.' },
  { id: 'B2', name: 'Upper Int. (B2)', desc: 'I can understand main ideas.' },
  { id: 'C1', name: 'Advanced (C1)', desc: 'I can express myself fluently.' }
];

const formats = [
  { id: 'video', label: 'YouTube Videos' },
  { id: 'podcast', label: 'Podcasts & Audio' },
  { id: 'news', label: 'News & Articles' },
  { id: 'interactive', label: 'Interactive Quizzes' },
  { id: 'music', label: 'Music & Lyrics' }
];

export default function OnboardingWizard() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [lang, setLang] = useState('');
  const [level, setLevel] = useState('');
  const [prefs, setPrefs] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => setStep(prev => prev + 1);
  const handlePrev = () => setStep(prev => prev - 1);

  const togglePref = (id: string) => {
    setPrefs(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleFinish = async () => {
    if (!user) return;
    setIsSubmitting(true);
    
    try {
      const token = Cookies.get('access_token');
      
      // 1. Send linguistic profile to Go Agent
      const agentApiUrl = process.env.NEXT_PUBLIC_AGENT_API_URL || 'http://localhost:3010';
      await fetch(`${agentApiUrl}/v1/users/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          targetLanguage: lang,
          cefrLevel: level,
          preferredResourceTypes: prefs
        })
      });

      // 2. Flip the onboarding complete flag in NestJS
      await apiClient.post('/users/onboarding');

      // Refresh window to re-eval AuthProvider
      window.location.href = '/';

    } catch (e) {
      console.error('Failed to complete onboarding', e);
      alert('Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center max-w-lg mx-auto w-full">
      <div className="w-full bg-slate-200 h-2 rounded-full mb-8 overflow-hidden">
        <motion.div 
          className="h-full bg-blue-600"
          initial={{ width: 0 }}
          animate={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full"
          >
            <h2 className="text-2xl font-bold mb-6 text-center">Which language do you want to learn?</h2>
            <div className="grid grid-cols-1 gap-3">
              {languages.map(l => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`p-4 border rounded-xl text-left transition-all ${lang === l.code ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600' : 'hover:border-slate-400 bg-white dark:bg-slate-800'}`}
                >
                  <span className="font-medium text-lg">{l.name}</span>
                </button>
              ))}
            </div>
            <div className="mt-8 flex justify-end">
              <button 
                disabled={!lang} 
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full"
          >
            <h2 className="text-2xl font-bold mb-6 text-center">What is your current level?</h2>
            <div className="grid grid-cols-1 gap-3">
              {levels.map(l => (
                <button
                  key={l.id}
                  onClick={() => setLevel(l.id)}
                  className={`p-4 border rounded-xl text-left transition-all ${level === l.id ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600' : 'hover:border-slate-400 bg-white dark:bg-slate-800'}`}
                >
                  <div className="font-medium text-lg text-slate-900">{l.name}</div>
                  <div className="text-sm text-slate-500 mt-1">{l.desc}</div>
                </button>
              ))}
            </div>
            <div className="mt-8 flex justify-between">
              <button onClick={handlePrev} className="px-6 py-2 text-slate-600 bg-slate-100 rounded-lg">Back</button>
              <button 
                disabled={!level} 
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full"
          >
            <h2 className="text-2xl font-bold mb-6 text-center">What formats do you prefer?</h2>
            <div className="grid grid-cols-2 gap-3">
              {formats.map(f => (
                <button
                  key={f.id}
                  onClick={() => togglePref(f.id)}
                  className={`p-4 border rounded-xl transition-all ${prefs.includes(f.id) ? 'border-blue-600 bg-blue-50' : 'hover:border-slate-400 bg-white dark:bg-slate-800'}`}
                >
                  <span className="font-medium">{f.label}</span>
                </button>
              ))}
            </div>
            <div className="mt-8 flex justify-between">
              <button onClick={handlePrev} className="px-6 py-2 text-slate-600 bg-slate-100 rounded-lg">Back</button>
              <button 
                disabled={isSubmitting || prefs.length === 0} 
                onClick={handleFinish}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg flex items-center justify-center disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Finish setup'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
