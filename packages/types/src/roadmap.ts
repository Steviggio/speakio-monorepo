// Single step within a learning roadmap, tracks title and completion state.
export interface RoadmapStep {
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: Date;
}

// User-owned learning roadmap with ordered steps and language scope.
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
