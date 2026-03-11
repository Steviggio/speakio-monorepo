export interface RoadmapStep {
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: Date;
}

export interface Roadmap {
  _id: string;
  title: string;
  description?: string;
  owner: string | { _id: string; username: string; avatarUrl?: string };
  language: string;
  steps: RoadmapStep[];
  createdAt: Date;
  updatedAt: Date;
}
