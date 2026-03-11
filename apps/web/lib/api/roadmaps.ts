import { apiClient } from './client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const apiGetMyRoadmaps = async () => {
  const response = await apiClient.get('/roadmaps');
  return response.data;
};

export const apiGetRoadmap = async (id: string) => {
  const response = await apiClient.get(`/roadmaps/${id}`);
  return response.data;
};

export const apiUpdateRoadmap = async (id: string, data: { title?: string; description?: string; deadline?: string }) => {
  const response = await apiClient.patch(`/roadmaps/${id}`, data);
  return response.data;
};

export const apiGetRoadmapStats = async () => {
  const response = await apiClient.get('/roadmaps/stats');
  return response.data;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const apiCreateRoadmap = async (data: any) => {
  const response = await apiClient.post('/roadmaps', data);
  return response.data;
};

export const apiToggleStep = async (roadmapId: string, stepIndex: number) => {
  const response = await apiClient.patch(`/roadmaps/${roadmapId}/steps/${stepIndex}/toggle`);
  return response.data;
};

export const apiAddStep = async (
  roadmapId: string, 
  data: { title: string; description?: string; deadline?: string; vocabularies?: any[] }
) => {
  const response = await apiClient.post(`/roadmaps/${roadmapId}/steps`, data);
  return response.data;
};

export const apiUpdateStep = async (
  roadmapId: string,
  stepIndex: number,
  data: { title?: string; description?: string; deadline?: string; completed?: boolean }
) => {
  const response = await apiClient.patch(`/roadmaps/${roadmapId}/steps/${stepIndex}`, data);
  return response.data;
};

export const apiAddSubStep = async (
  roadmapId: string, 
  stepIndex: number, 
  data: { title: string; description?: string; deadline?: string; vocabularies?: any[] }
) => {
  const response = await apiClient.post(`/roadmaps/${roadmapId}/steps/${stepIndex}/substeps`, data);
  return response.data;
};

export const apiToggleSubStep = async (roadmapId: string, stepIndex: number, subStepIndex: number) => {
  const response = await apiClient.patch(`/roadmaps/${roadmapId}/steps/${stepIndex}/substeps/${subStepIndex}/toggle`);
  return response.data;
};

export const apiUpdateSubStep = async (
  roadmapId: string,
  stepIndex: number,
  subStepIndex: number,
  data: { title?: string; description?: string; deadline?: string; completed?: boolean }
) => {
  const response = await apiClient.patch(`/roadmaps/${roadmapId}/steps/${stepIndex}/substeps/${subStepIndex}`, data);
  return response.data;
};

export const apiRemoveSubStep = async (roadmapId: string, stepIndex: number, subStepIndex: number) => {
  const response = await apiClient.delete(`/roadmaps/${roadmapId}/steps/${stepIndex}/substeps/${subStepIndex}`);
  return response.data;
};

export const apiUpdateStepVocabularies = async (roadmapId: string, stepIndex: number, vocabularies: any[]) => {
  const response = await apiClient.post(`/roadmaps/${roadmapId}/steps/${stepIndex}/vocabularies`, { vocabularies });
  return response.data;
};

export const apiUpdateSubStepVocabularies = async (roadmapId: string, stepIndex: number, subStepIndex: number, vocabularies: any[]) => {
  const response = await apiClient.post(`/roadmaps/${roadmapId}/steps/${stepIndex}/substeps/${subStepIndex}/vocabularies`, { vocabularies });
  return response.data;
};

export const apiDeleteRoadmap = async (id: string) => {
  const response = await apiClient.delete(`/roadmaps/${id}`);
  return response.data;
};

export const apiExportAnki = async (roadmapId: string) => {
  const response = await apiClient.post(`/roadmaps/${roadmapId}/anki-export`, {}, {
    responseType: 'blob' // Important to handle the file download
  });
  return response.data; // this will be a Blob
};
