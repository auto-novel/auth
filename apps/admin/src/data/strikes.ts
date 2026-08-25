import type { AuthSession } from '@novelia/admin-kit';

import { adminFetch } from './client';

export interface Strike {
  id: number;
  username: string | null;
  operatorUsername?: string;
  reason: string;
  evidence: string;
  point: number;
  createdAt: string;
  revokedAt?: string;
  revokedByUsername?: string;
  attr: Record<string, unknown>;
}

export interface StrikePage {
  total: number;
  items: Strike[];
}

export interface StrikeListParams {
  page: number;
  pageSize: number;
  username?: string;
  operatorUsername?: string;
  createdAfter?: number;
  createdBefore?: number;
}

export interface CreateStrikeRequest {
  username: string;
  reason: string;
  evidence: string;
  point: number;
}

export async function getStrikes(
  session: AuthSession,
  params: StrikeListParams,
): Promise<StrikePage> {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.pageSize),
  });
  if (params.username) searchParams.set('username', params.username);
  if (params.operatorUsername) {
    searchParams.set('operator_username', params.operatorUsername);
  }
  if (params.createdAfter !== undefined) {
    searchParams.set('created_after', String(params.createdAfter));
  }
  if (params.createdBefore !== undefined) {
    searchParams.set('created_before', String(params.createdBefore));
  }

  const response = await adminFetch(
    session,
    `/api/v1/admin/strikes?${searchParams}`,
  );
  return response.json() as Promise<StrikePage>;
}

export async function createStrike(
  session: AuthSession,
  request: CreateStrikeRequest,
): Promise<Strike> {
  const response = await adminFetch(session, '/api/v1/admin/strikes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return response.json() as Promise<Strike>;
}

export async function revokeStrike(
  session: AuthSession,
  strikeId: number,
): Promise<Strike> {
  const response = await adminFetch(
    session,
    `/api/v1/admin/strikes/${strikeId}/revoke`,
    { method: 'POST' },
  );
  return response.json() as Promise<Strike>;
}
