export interface VocabularyItem {
  front: string;
  back: string;
}

export interface RoadmapSubStep {
  id?: string;
  _id?: string;
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: Date;
  deadline?: Date;
  vocabularies?: VocabularyItem[];
}

export interface RoadmapStep {
  id?: string;
  _id?: string;
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: Date;
  deadline?: Date;
  vocabularies?: VocabularyItem[];
  subSteps?: RoadmapSubStep[];
}

export interface Roadmap {
  _id: string;
  id?: string;
  title: string;
  description?: string;
  owner: string | { _id: string; username: string; avatarUrl?: string };
  language: string;
  deadline?: Date;
  steps: RoadmapStep[];
  createdAt: Date;
  updatedAt: Date;
}

