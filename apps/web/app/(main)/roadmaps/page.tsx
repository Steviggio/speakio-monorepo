'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { apiGetMyRoadmaps, apiCreateRoadmap, apiDeleteRoadmap } from '@/lib/api/roadmaps';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useTranslation } from '@/lib/i18n';

interface RoadmapItem {
  _id: string; title: string; description?: string; language: string;
  steps: { title: string; completed: boolean }[]; updatedAt: string;
}

export default function RoadmapsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [roadmaps, setRoadmaps] = useState<RoadmapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newLang, setNewLang] = useState('fr');

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try { const data = await apiGetMyRoadmaps(); setRoadmaps(data); }
      catch (error) { console.error('Error fetching roadmaps:', error); } finally { setIsLoading(false); }
    };
    fetch();
  }, [user]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      const roadmap = await apiCreateRoadmap({ title: newTitle.trim(), description: newDesc.trim() || undefined, language: newLang });
      setRoadmaps((prev) => [roadmap, ...prev]);
      setNewTitle(''); setNewDesc(''); setShowCreate(false);
    } catch (error) { console.error('Error creating roadmap:', error); }
  };

  const handleDelete = async (e: React.MouseEvent, id: string): Promise<void> => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(t('roadmaps.confirmDelete'))) return;

    try {
      await apiDeleteRoadmap(id);
      setRoadmaps((prev) => prev.filter((r) => r._id !== id));
    } catch (error) {
      console.error('Failed to delete roadmap:', error);
    }
  };

  const getProgress = (steps: { completed: boolean }[]) => steps.length === 0 ? 0 : Math.round((steps.filter((s) => s.completed).length / steps.length) * 100);

  if (!user) return (
    <div className="max-w-4xl mx-auto py-16 px-4 text-center">
      <p className="text-[var(--color-text-muted)]"><Link href="/login" className="text-[var(--color-brand)]">{t('common.login')}</Link> {t('roadmaps.loginToManage')}</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] tracking-tight">{t('roadmaps.title')}</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">{t('roadmaps.subtitle')}</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          + {t('roadmaps.create')}
        </Button>
      </div>

      {showCreate && (
        <div className="rounded-lg border border-[var(--color-border)] bg-white p-5 shadow-sm mb-6">
          <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">{t('roadmaps.createRoadmap')}</h3>
          <div className="space-y-3">
            <Input type="text" id="roadmap-title" name="title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder={t('roadmaps.roadmapTitle')} />
            <Input type="text" id="roadmap-desc" name="description" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder={t('roadmaps.roadmapDesc')} />
            <div className="flex gap-3">
              <select id="roadmap-lang" name="language" value={newLang} onChange={(e) => setNewLang(e.target.value)} className="h-10 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30 appearance-none">
                <option value="en">English</option><option value="fr">Français</option><option value="es">Español</option><option value="de">Deutsch</option>
              </select>
              <Button onClick={handleCreate} disabled={!newTitle.trim()}>{t('roadmaps.create')}</Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>{t('roadmaps.cancel')}</Button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border border-[var(--color-border)] bg-white p-5">
              <div className="h-4 bg-[var(--color-bg-hover)] rounded w-1/2 mb-3" />
              <div className="h-2 bg-[var(--color-bg-hover)] rounded w-full" />
            </div>
          ))}
        </div>
      ) : roadmaps.length === 0 ? (
        <p className="text-center text-[var(--color-text-muted)] py-12">{t('roadmaps.noRoadmaps')}</p>
      ) : (
        <div className="space-y-3">
          {roadmaps.map((roadmap) => {
            const progress = getProgress(roadmap.steps);
            return (
              <Link href={`/roadmaps/${roadmap._id}`} className="hover:text-[var(--color-brand)] transition-colors">
                <div key={roadmap._id} className="rounded-lg border border-[var(--color-border)] bg-white p-5 shadow-sm group">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-base font-semibold text-[var(--color-text)] group-hover:text-[var(--color-brand)]">{roadmap.title}</h3>
                    {roadmap.description && <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{roadmap.description}</p>}
                    <Button variant="ghost" size="sm" onClick={(e) => handleDelete(e, roadmap._id)} className="text-red-500 hover:text-red-600 transition-colors px-2 h-auto text-xs py-1">{t('roadmaps.deleteRoadmap')}</Button>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] mb-1">
                      <span>{roadmap.steps.filter((s) => s.completed).length}/{roadmap.steps.length} {t('roadmaps.stepsCompleted')}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-[var(--color-bg)] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--color-brand)] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-[var(--color-text-muted)]">
                    <span className="uppercase">{roadmap.language}</span>
                    <span>· Updated {new Date(roadmap.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>

            );
          })}
        </div>
      )}
    </div>
  );
}
