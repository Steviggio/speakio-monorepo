export type ApiEnvelope<T> = {
  data: T;
  meta?: unknown;
  message?: string;
  statusCode?: number;
  timestamp?: string;
};

// Extracts the `data` field from the standard API envelope, or returns raw payload.
export function unwrapApiData<T>(payload: T | ApiEnvelope<T>): T {
  if (
    payload &&
    typeof payload === 'object' &&
    'data' in (payload as Record<string, unknown>)
  ) {
    return (payload as ApiEnvelope<T>).data;
  }

  return payload as T;
}