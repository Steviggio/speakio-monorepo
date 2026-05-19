import { apiClient } from './client';
import { unwrapApiData } from './utils';

export type ResourceVoteType = 'positive' | 'negative';

export type ResourceItem = {
  _id: string;
  title: string;
  description: string;
  url: string;
  canonicalUrl?: string;
  type: string;
  language: string;
  tags: string[];
  pricing: string;
  positiveVotes: number;
  negativeVotes: number;
  quality?: { normalizationStatus?: string };
  enrichment?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  submittedBy?: {
    _id?: string;
    username?: string;
    avatarUrl?: string | null;
  } | null;
};

export type ResourceListParams = {
  page?: number | string;
  limit?: number | string;
  search?: string;
  language?: string;
  type?: string;
  pricing?: string;
  providerDomain?: string;
  publisherSlug?: string;
  seriesSlug?: string;
  sort?: 'newest' | 'oldest' | 'popular';
};

export type ResourceListResponse = {
  data: ResourceItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type RelatedResourcesResponse = {
  sameSeries: {
    type: 'SERIES';
    name: string | null;
    slug: string | null;
    items: ResourceItem[];
  };
  samePublisher: {
    type: 'PUBLISHER';
    name: string | null;
    slug: string | null;
    items: ResourceItem[];
  };
  samePlatform: {
    type: 'PLATFORM';
    name: string | null;
    domain: string | null;
    items: ResourceItem[];
  };
};

export type MyVoteResponse = {
  type: ResourceVoteType | null;
} | null;

export type CreateOrUpdateResourceInput = {
  title: string;
  description: string;
  url: string;
  type: string;
  language: string;
  tags?: string[];
  pricing: string;
};

// Strips undefined/null/empty values from query params before sending to the API.
function cleanParams(params?: Record<string, string | number | undefined>) {
  if (!params) return undefined;

  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    ),
  );
}

// Fetches a paginated, filterable list of published resources.
export async function apiGetResources(
  params?: ResourceListParams,
): Promise<ResourceListResponse> {
  const response = await apiClient.get('/resources', {
    params: cleanParams(params),
  });

  return unwrapApiData<ResourceListResponse>(response.data);
}

export type FacetItem = { _id: string; count: number; label?: string; name?: string };

export type ResourceFacets = {
  types: FacetItem[];
  pricing: FacetItem[];
  languages: FacetItem[];
  platforms: FacetItem[];
  publishers: FacetItem[];
  series: FacetItem[];
};

// Returns aggregated filter facets (types, pricing, languages, platforms).
export async function apiGetResourceFacets(): Promise<ResourceFacets> {
  const response = await apiClient.get('/resources/facets');
  return unwrapApiData<ResourceFacets>(response.data);
}

// Fetches a single resource by ID with submitter info populated.
export async function apiGetResource(id: string): Promise<ResourceItem> {
  const response = await apiClient.get(`/resources/${id}`);
  return unwrapApiData<ResourceItem>(response.data);
}

// Fetches resources related by series, publisher, or platform.
export async function apiGetRelatedResources(
  id: string,
): Promise<RelatedResourcesResponse> {
  const response = await apiClient.get(`/resources/${id}/related`);
  return unwrapApiData<RelatedResourcesResponse>(response.data);
}

// Submits a new resource for review.
export async function apiCreateResource(
  data: CreateOrUpdateResourceInput,
): Promise<ResourceItem> {
  const response = await apiClient.post('/resources', data);
  return unwrapApiData<ResourceItem>(response.data);
}

export async function apiUpdateResource(
  id: string,
  data: Partial<CreateOrUpdateResourceInput>,
): Promise<ResourceItem> {
  const response = await apiClient.patch(`/resources/${id}`, data);
  return unwrapApiData<ResourceItem>(response.data);
}

// Casts or toggles a positive/negative vote on a resource.
export async function apiVote(
  resourceId: string,
  type: ResourceVoteType,
): Promise<{ success?: boolean } | Record<string, unknown>> {
  const response = await apiClient.post('/votes', { resourceId, type });
  return unwrapApiData<{ success?: boolean } | Record<string, unknown>>(response.data);
}

// Returns the current user's vote on a specific resource, if any.
export async function apiGetMyVote(
  resourceId: string,
): Promise<MyVoteResponse> {
  const response = await apiClient.get(`/votes/${resourceId}/my-vote`);
  return unwrapApiData<MyVoteResponse>(response.data);
}