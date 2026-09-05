import type { ApiClient } from './client';

export interface BanUserRequest {
  username: string;
  reason: string;
}

export interface CreateStrikeResponse {
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

export interface CreateStrikeRequest {
  username: string;
  reason: string;
  evidence: string;
  point: number;
}

export function createAdminEndpoints(client: ApiClient) {
  return {
    banUser(request: BanUserRequest) {
      return client.post('admin/user/ban', { json: request }).text();
    },
    createStrike(request: CreateStrikeRequest) {
      return client
        .post('admin/strikes', { json: request })
        .json<CreateStrikeResponse>();
    },
  };
}
