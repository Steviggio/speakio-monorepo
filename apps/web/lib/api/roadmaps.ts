import { apiClient } from "./client";
import { unwrapApiData } from "./utils";

export const apiGetMyRoadmaps = async () => {
  const response = await apiClient.get("/roadmaps");
  return unwrapApiData<any>(response.data);
};

export const apiGetRoadmap = async (id: string) => {
  const response = await apiClient.get(`/roadmaps/${id}`);
  return unwrapApiData<any>(response.data);
};

export const apiUpdateRoadmap = async (
  id: string,
  data: { title?: string; description?: string; deadline?: string },
) => {
  const response = await apiClient.patch(`/roadmaps/${id}`, data);
  return unwrapApiData<any>(response.data);
};

export const apiGetRoadmapStats = async () => {
  const response = await apiClient.get("/roadmaps/stats");
  return unwrapApiData<any>(response.data);
};

export const apiCreateRoadmap = async (data: any) => {
  const response = await apiClient.post("/roadmaps", data);
  return unwrapApiData<any>(response.data);
};

export const apiToggleStep = async (
  roadmapId: string,
  stepIdOrIndex: string | number,
) => {
  const response = await apiClient.patch(
    `/roadmaps/${roadmapId}/steps/${stepIdOrIndex}/toggle`,
  );
  return unwrapApiData<any>(response.data);
};

export const apiAddStep = async (
  roadmapId: string,
  data: {
    title: string;
    description?: string;
    deadline?: string;
    vocabularies?: any[];
  },
) => {
  const response = await apiClient.post(`/roadmaps/${roadmapId}/steps`, data);
  return unwrapApiData<any>(response.data);
};

export const apiUpdateStep = async (
  roadmapId: string,
  stepIdOrIndex: string | number,
  data: {
    title?: string;
    description?: string;
    deadline?: string;
    completed?: boolean;
  },
) => {
  const response = await apiClient.patch(
    `/roadmaps/${roadmapId}/steps/${stepIdOrIndex}`,
    data,
  );
  return unwrapApiData<any>(response.data);
};

export const apiAddSubStep = async (
  roadmapId: string,
  stepIdOrIndex: string | number,
  data: {
    title: string;
    description?: string;
    deadline?: string;
    vocabularies?: any[];
  },
) => {
  const response = await apiClient.post(
    `/roadmaps/${roadmapId}/steps/${stepIdOrIndex}/substeps`,
    data,
  );
  return unwrapApiData<any>(response.data);
};

export const apiToggleSubStep = async (
  roadmapId: string,
  stepIdOrIndex: string | number,
  subStepIdOrIndex: string | number,
) => {
  const response = await apiClient.patch(
    `/roadmaps/${roadmapId}/steps/${stepIdOrIndex}/substeps/${subStepIdOrIndex}/toggle`,
  );
  return unwrapApiData<any>(response.data);
};

export const apiUpdateSubStep = async (
  roadmapId: string,
  stepIdOrIndex: string | number,
  subStepIdOrIndex: string | number,
  data: {
    title?: string;
    description?: string;
    deadline?: string;
    completed?: boolean;
  },
) => {
  const response = await apiClient.patch(
    `/roadmaps/${roadmapId}/steps/${stepIdOrIndex}/substeps/${subStepIdOrIndex}`,
    data,
  );
  return unwrapApiData<any>(response.data);
};

export const apiRemoveSubStep = async (
  roadmapId: string,
  stepIdOrIndex: string | number,
  subStepIdOrIndex: string | number,
) => {
  const response = await apiClient.delete(
    `/roadmaps/${roadmapId}/steps/${stepIdOrIndex}/substeps/${subStepIdOrIndex}`,
  );
  return unwrapApiData<any>(response.data);
};

export const apiUpdateStepVocabularies = async (
  roadmapId: string,
  stepIdOrIndex: string | number,
  vocabularies: any[],
) => {
  const response = await apiClient.post(
    `/roadmaps/${roadmapId}/steps/${stepIdOrIndex}/vocabularies`,
    { vocabularies },
  );
  return unwrapApiData<any>(response.data);
};

export const apiUpdateSubStepVocabularies = async (
  roadmapId: string,
  stepIdOrIndex: string | number,
  subStepIdOrIndex: string | number,
  vocabularies: any[],
) => {
  const response = await apiClient.post(
    `/roadmaps/${roadmapId}/steps/${stepIdOrIndex}/substeps/${subStepIdOrIndex}/vocabularies`,
    { vocabularies },
  );
  return unwrapApiData<any>(response.data);
};

export const apiDeleteRoadmap = async (id: string) => {
  const response = await apiClient.delete(`/roadmaps/${id}`);
  return unwrapApiData<any>(response.data);
};

export const apiExportAnki = async (roadmapId: string) => {
  const response = await apiClient.post(
    `/roadmaps/${roadmapId}/anki-export`,
    {},
    {
      responseType: "blob",
    },
  );
  return response.data;
};
