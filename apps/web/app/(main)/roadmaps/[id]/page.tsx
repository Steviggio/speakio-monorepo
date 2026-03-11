'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { 
  apiGetRoadmap, apiToggleStep, apiAddStep, apiExportAnki,
  apiAddSubStep, apiToggleSubStep, apiUpdateStepVocabularies, apiUpdateSubStepVocabularies,
  apiUpdateRoadmap, apiUpdateStep
} from '@/lib/api/roadmaps';
import { useTranslation } from '@/lib/i18n';
import { Input } from '@/components/ui/Input';
import { Calendar as CalendarUI } from '@/components/ui/Calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { ChevronDown, ChevronRight, Plus, Calendar, BookOpen, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';



interface VocabularyItem { front: string; back: string; }
interface SubStep {
  title: string; description?: string; completed: boolean; completedAt?: string;
  deadline?: string; vocabularies?: VocabularyItem[];
}
interface Step {
  title: string; description?: string; completed: boolean; completedAt?: string;
  deadline?: string; vocabularies?: VocabularyItem[]; subSteps?: SubStep[];
}
interface RoadmapDetail {
  _id: string; title: string; description?: string;
  owner: { _id: string; username: string } | null;
  language: string; steps: Step[]; createdAt: string; deadline?: string;
}

export default function RoadmapDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAuth();
  const { t } = useTranslation();
  const [roadmap, setRoadmap] = useState<RoadmapDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [newStepTitle, setNewStepTitle] = useState('');
  const [toggling, setToggling] = useState<{ step: number, subStep?: number } | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  
  // Forms state
  const [newSubStepTarget, setNewSubStepTarget] = useState<number | null>(null);
  const [newSubStepTitle, setNewSubStepTitle] = useState('');
  
  const [newVocabTarget, setNewVocabTarget] = useState<{ step: number, subStep?: number } | null>(null);
  const [newVocabFront, setNewVocabFront] = useState('');
  const [newVocabBack, setNewVocabBack] = useState('');

  const fetchRoadmap = useCallback(async () => {
    try { const data = await apiGetRoadmap(id); setRoadmap(data); }
    catch { /* */ } finally { setIsLoading(false); }
  }, [id]);

  useEffect(() => { fetchRoadmap(); }, [fetchRoadmap]);

  const handleToggle = async (stepIndex: number, subStepIndex?: number) => {
    if (toggling) return;
    setToggling({ step: stepIndex, subStep: subStepIndex });
    try {
      let updated;
      if (subStepIndex !== undefined) {
        updated = await apiToggleSubStep(id, stepIndex, subStepIndex);
      } else {
        updated = await apiToggleStep(id, stepIndex);
      }
      setRoadmap(updated);
    } catch { /* */ } finally { setToggling(null); }
  };

  const handleAddStep = async () => {
    if (!newStepTitle.trim()) return;
    try { const updated = await apiAddStep(id, { title: newStepTitle.trim() }); setRoadmap(updated); setNewStepTitle(''); }
    catch { /* */ }
  };

  const handleAddSubStep = async (stepIndex: number) => {
    if (!newSubStepTitle.trim()) return;
    try {
      const updated = await apiAddSubStep(id, stepIndex, { title: newSubStepTitle.trim() });
      setRoadmap(updated);
      setNewSubStepTitle('');
      setNewSubStepTarget(null);
      // Auto-expand the step to show the new sub-step
      const newExpanded = new Set(expandedSteps);
      newExpanded.add(stepIndex);
      setExpandedSteps(newExpanded);
    } catch { /* */ }
  };

  const handleAddVocabulary = async (stepIndex: number, subStepIndex?: number) => {
    if (!newVocabFront.trim() || !newVocabBack.trim() || !roadmap) return;
    
    // Get existing vocabularies based on where we are adding this
    let existingVocabs: VocabularyItem[] = [];
    if (subStepIndex !== undefined) {
      const step = roadmap.steps[stepIndex];
      if (step && step.subSteps && step.subSteps[subStepIndex]) {
        existingVocabs = step.subSteps[subStepIndex].vocabularies || [];
      }
    } else {
      existingVocabs = roadmap.steps[stepIndex]?.vocabularies || [];
    }
    
    const newVocabList = [...existingVocabs, { front: newVocabFront.trim(), back: newVocabBack.trim() }];

    try {
      let updated;
      if (subStepIndex !== undefined) {
        updated = await apiUpdateSubStepVocabularies(id, stepIndex, subStepIndex, newVocabList);
      } else {
        updated = await apiUpdateStepVocabularies(id, stepIndex, newVocabList);
      }
      setRoadmap(updated);
      setNewVocabFront('');
      setNewVocabBack('');
      // We don't close the target because the user might want to add multiple words rapidly
    } catch { /* */ }
  };

  const toggleExpand = (stepIndex: number) => {
    const newSet = new Set(expandedSteps);
    if (newSet.has(stepIndex)) newSet.delete(stepIndex);
    else newSet.add(stepIndex);
    setExpandedSteps(newSet);
  };

  const handleUpdateRoadmapDeadline = async (date: Date | undefined) => {
    if (!date) return;
    try {
      const updated = await apiUpdateRoadmap(id, { deadline: date.toISOString() });
      setRoadmap(updated);
    } catch { /* */ }
  };

  const handleUpdateStepDeadline = async (stepIndex: number, date: Date | undefined) => {
    if (!date) return;
    try {
      const updated = await apiUpdateStep(id, stepIndex, { deadline: date.toISOString() });
      setRoadmap(updated);
    } catch { /* */ }
  };

  const handleExportAnki = async () => {
    if (!roadmap || roadmap.steps.length === 0) return;
    setIsExporting(true);
    try {
      const blob = await apiExportAnki(id);

      // Create a temporary link to download the blob
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `anki-export-${roadmap.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error('Failed to export to Anki', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="animate-pulse">
        <div className="h-6 bg-[var(--color-bg-hover)] rounded w-2/3 mb-4" />
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-[var(--color-bg-hover)] rounded-lg" />)}</div>
      </div>
    </div>
  );

  if (!roadmap) return (
    <div className="max-w-3xl mx-auto py-8 px-4 text-center">
      <p className="text-[var(--color-text-muted)]">{t('roadmaps.notFound')}</p>
      <Link href="/roadmaps" className="text-[var(--color-brand)] mt-3 inline-block text-sm">{t('roadmaps.backToRoadmaps')}</Link>
    </div>
  );

  const completedCount = roadmap.steps.filter((s) => s.completed).length;
  const progress = roadmap.steps.length > 0 ? Math.round((completedCount / roadmap.steps.length) * 100) : 0;
  const isOwner = user && roadmap.owner && (user as any)._id === (typeof roadmap.owner === 'string' ? roadmap.owner : roadmap.owner._id);

  // Calculate days since creation
  const createdDate = new Date(roadmap.createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - createdDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const daysString = diffDays === 0 ? "Aujourd'hui" : `il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Link href="/roadmaps" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors mb-6 inline-block">{t('roadmaps.backToRoadmaps')}</Link>

      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)] mb-1">{roadmap.title}</h1>
            {roadmap.description && <p className="text-[var(--color-text-secondary)]">{roadmap.description}</p>}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs text-[var(--color-text-muted)]">
              <span className="uppercase font-medium bg-[var(--color-border)] px-2 py-0.5 rounded text-[var(--color-text)]">{roadmap.language}</span>
              <span className="flex items-center gap-1"><Clock size={14} /> Créée {daysString}</span>
              <span>· {completedCount}/{roadmap.steps.length} {t('roadmaps.stepsCompleted')}</span>
            </div>
            {isOwner && (
              <div className="mt-3 flex items-center gap-2 text-sm">
                <span className="text-[var(--color-text-secondary)] font-medium">Objectif Final :</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-2 px-3 py-1.5 text-xs text-left border rounded bg-white text-[var(--color-text)] hover:border-[var(--color-brand)] transition-colors">
                      <Calendar size={14} className="text-[var(--color-text-muted)]" />
                      <span>{roadmap.deadline ? format(new Date(roadmap.deadline), 'PPP', { locale: fr }) : 'Sélectionner une date...'}</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[100]" align="start">
                    <CalendarUI
                      mode="single"
                      selected={roadmap.deadline ? new Date(roadmap.deadline) : undefined}
                      onSelect={handleUpdateRoadmapDeadline}
                      initialFocus
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
          {/* Anki Export Button */}
          {roadmap.steps.length > 0 && (
            <button
              onClick={handleExportAnki}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#eeeaff] text-[#6941C6] hover:bg-[#e4dcfc] text-sm font-medium rounded-lg transition-colors border border-[#d6cbfa] disabled:opacity-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isExporting ? "animate-spin" : ""}>
                {isExporting ? (
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                ) : (
                  <>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </>
                )}
              </svg>
              {isExporting ? 'Exporting...' : 'Export to Anki'}
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className="text-[var(--color-text-secondary)]">Progress</span>
          <span className="text-[var(--color-text)] font-semibold">{progress}%</span>
        </div>
        <div className="h-2 bg-[var(--color-bg)] rounded-full overflow-hidden">
          <div className="h-full bg-[var(--color-brand)] rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3 mb-6">
        {roadmap.steps.map((step, stepIndex) => {
          const isExpanded = expandedSteps.has(stepIndex);
          const isTogglingStep = toggling?.step === stepIndex && toggling?.subStep === undefined;

          return (
            <div key={stepIndex} className={`rounded-lg border transition-colors overflow-hidden ${step.completed ? 'border-green-200 bg-green-50/30' : 'border-[var(--color-border)] bg-white'}`}>
              
              {/* Step Header (Clickable Accordion) */}
              <div 
                className={`p-3.5 flex items-start gap-3 cursor-pointer hover:bg-black/[0.02] ${isExpanded && !step.completed ? 'bg-black/[0.01] border-b border-[var(--color-border)]' : ''}`}
                onClick={() => toggleExpand(stepIndex)}
              >
                <div onClick={(e) => e.stopPropagation()}>
                  {isOwner ? (
                    <button onClick={() => handleToggle(stepIndex)} disabled={isTogglingStep}
                      className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${step.completed ? 'bg-green-500 border-green-500 text-white' : 'border-[var(--color-border)] hover:border-[var(--color-brand)]'
                        } disabled:opacity-50`}>
                      {step.completed && <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </button>
                  ) : (
                    <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${step.completed ? 'bg-green-500 border-green-500 text-white' : 'border-[var(--color-border)]'
                      }`}>
                      {step.completed && <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={`text-base font-medium ${step.completed ? 'text-[var(--color-text-muted)] line-through' : 'text-[var(--color-text)]'}`}>{step.title}</p>
                  {step.description && <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{step.description}</p>}
                  
                  {/* Meta info row */}
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[var(--color-text-muted)]">
                    {/* Editable Deadline for Step */}
                    {isOwner ? (
                      <div onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="flex items-center gap-1.5 bg-black/[0.03] px-2 py-1 rounded cursor-pointer hover:bg-black/[0.06] transition-colors">
                              <Calendar size={12} />
                              <span>{step.deadline ? format(new Date(step.deadline), 'PP', { locale: fr }) : 'Ajouter deadline'}</span>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 z-[100]" align="start" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                            <div onClick={(e) => e.stopPropagation()}>
                              <CalendarUI
                                mode="single"
                                selected={step.deadline ? new Date(step.deadline) : undefined}
                                onSelect={(date) => handleUpdateStepDeadline(stepIndex, date)}
                                initialFocus
                                locale={fr}
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    ) : (
                      step.deadline && <span className="flex items-center gap-1"><Calendar size={12} /> {format(new Date(step.deadline), 'PP', { locale: fr })}</span>
                    )}

                    {step.vocabularies && step.vocabularies.length > 0 && (
                      <span className="flex items-center gap-1"><BookOpen size={12} /> {step.vocabularies.length} words</span>
                    )}
                    {step.completedAt && <span className="text-green-600">Completed {new Date(step.completedAt).toLocaleDateString()}</span>}
                  </div>
                </div>

                <div className="flex-shrink-0 text-[var(--color-text-muted)] mt-1">
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </div>

              {/* Step Expanded Content */}
              {isExpanded && (
                <div className="p-4 bg-black/[0.01]">
                  
                  {/* Sub-steps Section */}
                  <div className="mb-5">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">Sub-tasks</h4>
                    
                    {(!step.subSteps || step.subSteps.length === 0) && (
                      <p className="text-sm text-[var(--color-text-muted)] mb-3 italic">No sub-tasks yet.</p>
                    )}

                    <div className="space-y-2 mb-3">
                      {step.subSteps?.map((subStep, subIdx) => {
                        const isTogglingSub = toggling?.step === stepIndex && toggling?.subStep === subIdx;
                        return (
                          <div key={subIdx} className="pl-2 border-l-2 border-[var(--color-border)] py-1 flex items-start gap-2.5">
                            {isOwner ? (
                              <button onClick={() => handleToggle(stepIndex, subIdx)} disabled={isTogglingSub}
                                className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${subStep.completed ? 'bg-green-500 border-green-500 text-white' : 'border-[var(--color-border)] hover:border-[var(--color-brand)]'} disabled:opacity-50`}>
                                {subStep.completed && <svg width="8" height="8" viewBox="0 0 10 10"><path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                              </button>
                            ) : (
                              <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${subStep.completed ? 'bg-green-500 border-green-500 text-white' : 'border-[var(--color-border)]'}`}>
                                {subStep.completed && <svg width="8" height="8" viewBox="0 0 10 10"><path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                              </div>
                            )}
                            <div className="flex-1">
                              <p className={`text-sm ${subStep.completed ? 'text-[var(--color-text-muted)] line-through' : 'text-[var(--color-text)]'}`}>{subStep.title}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {isOwner && newSubStepTarget === stepIndex ? (
                      <div className="flex gap-2 pl-4 border-l-2 border-[var(--color-brand)] animate-in fade-in slide-in-from-top-2">
                        <Input autoFocus value={newSubStepTitle} onChange={(e) => setNewSubStepTitle(e.target.value)} placeholder="Sub-task title..." className="h-8 text-sm" onKeyDown={(e) => e.key === 'Enter' && handleAddSubStep(stepIndex)} />
                        <button onClick={() => handleAddSubStep(stepIndex)} disabled={!newSubStepTitle.trim()} className="px-3 py-1 bg-[var(--color-text)] text-white text-xs font-medium rounded transition-colors disabled:opacity-40">Add</button>
                        <button onClick={() => { setNewSubStepTarget(null); setNewSubStepTitle(''); }} className="px-3 py-1 bg-transparent hover:bg-black/5 text-[var(--color-text-secondary)] text-xs font-medium rounded transition-colors">Cancel</button>
                      </div>
                    ) : (
                      isOwner && <button onClick={() => setNewSubStepTarget(stepIndex)} className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-brand)] hover:text-[#5535a0] transition-colors"><Plus size={14} /> Add sub-task</button>
                    )}
                  </div>

                  {/* Vocabulary Section */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3 flex items-center gap-1.5"><BookOpen size={14} /> Vocabulary</h4>
                    
                    {(!step.vocabularies || step.vocabularies.length === 0) && (
                      <p className="text-sm text-[var(--color-text-muted)] mb-3 italic">No vocabulary words saved.</p>
                    )}

                    {step.vocabularies && step.vocabularies.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {step.vocabularies.map((vocab, vIdx) => (
                          <div key={vIdx} className="bg-white border rounded p-2 text-sm flex flex-col shadow-sm">
                            <span className="font-medium text-[var(--color-text)]">{vocab.front}</span>
                            <span className="text-[var(--color-text-secondary)] text-xs mt-0.5">{vocab.back}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {isOwner && newVocabTarget?.step === stepIndex && newVocabTarget?.subStep === undefined ? (
                      <div className="bg-white p-3 rounded border border-[var(--color-brand)]/30 animate-in fade-in slide-in-from-top-2">
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <Input autoFocus value={newVocabFront} onChange={(e) => setNewVocabFront(e.target.value)} placeholder="Word (Front)" className="h-8 text-sm" />
                          <Input value={newVocabBack} onChange={(e) => setNewVocabBack(e.target.value)} placeholder="Translation (Back)" className="h-8 text-sm" onKeyDown={(e) => e.key === 'Enter' && handleAddVocabulary(stepIndex)} />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleAddVocabulary(stepIndex)} disabled={!newVocabFront.trim() || !newVocabBack.trim()} className="px-3 py-1 bg-[var(--color-brand)] text-white text-xs font-medium rounded transition-colors disabled:opacity-40">Save Word</button>
                          <button onClick={() => { setNewVocabTarget(null); setNewVocabFront(''); setNewVocabBack(''); }} className="px-3 py-1 bg-transparent hover:bg-black/5 text-[var(--color-text-secondary)] text-xs font-medium rounded transition-colors">Done</button>
                        </div>
                      </div>
                    ) : (
                      isOwner && <button onClick={() => setNewVocabTarget({ step: stepIndex })} className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-brand)] hover:text-[#5535a0] transition-colors"><Plus size={14} /> Add vocabulary word</button>
                    )}
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>

      {isOwner && (
        <div className="flex gap-2">
          <div className="flex-1"><Input id="new-step" name="step" type="text" value={newStepTitle} onChange={(e) => setNewStepTitle(e.target.value)} placeholder={t('roadmaps.stepTitle')} onKeyDown={(e) => e.key === 'Enter' && handleAddStep()} className="h-10" /></div>
          <button onClick={handleAddStep} disabled={!newStepTitle.trim()}
            className="px-4 py-2 bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-40">{t('roadmaps.addStep')}</button>
        </div>
      )}
    </div>
  );
}
