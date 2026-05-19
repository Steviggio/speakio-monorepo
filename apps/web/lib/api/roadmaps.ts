import { apiClient } from './client';
import { unwrapApiData } from './utils';

// Fetches all learning roadmaps owned by the current user.
export const apiGetMyRoadmaps = async () => {
  const response = await apiClient.get('/roadmaps');
  return unwrapApiData<any>(response.data);
};

// Fetches a single roadmap by ID with all steps and sub-steps.
export const apiGetRoadmap = async (id: string) => {
  const response = await apiClient.get(`/roadmaps/${id}`);
  return unwrapApiData<any>(response.data);
};

export const apiUpdateRoadmap = async (id: string, data: { title?: string; description?: string; deadline?: string }) => {
  const response = await apiClient.patch(`/roadmaps/${id}`, data);
  return unwrapApiData<any>(response.data);
};

export const apiGetRoadmapStats = async () => {
  const response = await apiClient.get('/roadmaps/stats');
  return unwrapApiData<any>(response.data);
};

// Creates a new learning roadmap with initial steps.
export const apiCreateRoadmap = async (data: any) => {
  const response = await apiClient.post('/roadmaps', data);
  return unwrapApiData<any>(response.data);
};

// Toggles the completed state of a roadmap step.
export const apiToggleStep = async (roadmapId: string, stepIndex: number) => {
  const response = await apiClient.patch(`/roadmaps/${roadmapId}/steps/${stepIndex}/toggle`);
  return unwrapApiData<any>(response.data);
};

// Appends a new step to an existing roadmap.
export const apiAddStep = async (
  roadmapId: string, 
  data: { title: string; description?: string; deadline?: string; vocabularies?: any[] }
) => {
  const response = await apiClient.post(`/roadmaps/${roadmapId}/steps`, data);
  return unwrapApiData<any>(response.data);
};

export const apiUpdateStep = async (
  roadmapId: string,
  stepIndex: number,
  data: { title?: string; description?: string; deadline?: string; completed?: boolean }
) => {
  const response = await apiClient.patch(`/roadmaps/${roadmapId}/steps/${stepIndex}`, data);
  return unwrapApiData<any>(response.data);
};

// Appends a sub-step under a specific roadmap step.
export const apiAddSubStep = async (
  roadmapId: string, 
  stepIndex: number, 
  data: { title: string; description?: string; deadline?: string; vocabularies?: any[] }
) => {
  const response = await apiClient.post(`/roadmaps/${roadmapId}/steps/${stepIndex}/substeps`, data);
  return unwrapApiData<any>(response.data);
};

// Toggles the completed state of a sub-step.
export const apiToggleSubStep = async (roadmapId: string, stepIndex: number, subStepIndex: number) => {
  const response = await apiClient.patch(`/roadmaps/${roadmapId}/steps/${stepIndex}/substeps/${subStepIndex}/toggle`);
  return unwrapApiData<any>(response.data);
};

export const apiUpdateSubStep = async (
  roadmapId: string,
  stepIndex: number,
  subStepIndex: number,
  data: { title?: string; description?: string; deadline?: string; completed?: boolean }
) => {
  const response = await apiClient.patch(`/roadmaps/${roadmapId}/steps/${stepIndex}/substeps/${subStepIndex}`, data);
  return unwrapApiData<any>(response.data);
};

export const apiRemoveSubStep = async (roadmapId: string, stepIndex: number, subStepIndex: number) => {
  const response = await apiClient.delete(`/roadmaps/${roadmapId}/steps/${stepIndex}/substeps/${subStepIndex}`);
  return unwrapApiData<any>(response.data);
};

export const apiUpdateStepVocabularies = async (roadmapId: string, stepIndex: number, vocabularies: any[]) => {
  const response = await apiClient.post(`/roadmaps/${roadmapId}/steps/${stepIndex}/vocabularies`, { vocabularies });
  return unwrapApiData<any>(response.data);
};

export const apiUpdateSubStepVocabularies = async (roadmapId: string, stepIndex: number, subStepIndex: number, vocabularies: any[]) => {
  const response = await apiClient.post(`/roadmaps/${roadmapId}/steps/${stepIndex}/substeps/${subStepIndex}/vocabularies`, { vocabularies });
  return unwrapApiData<any>(response.data);
};

// Deletes a roadmap by ID.
export const apiDeleteRoadmap = async (id: string) => {
  const response = await apiClient.delete(`/roadmaps/${id}`);
  return unwrapApiData<any>(response.data);
};

// Exports all vocabulary from a roadmap as an Anki-compatible CSV blob.
export const apiExportAnki = async (roadmapId: string) => {
  const response = await apiClient.post(`/roadmaps/${roadmapId}/anki-export`, {}, {
    responseType: 'blob' 
  });
  return response.data;
};
