import type { AuthSession } from '@novelia/admin-kit';

import { adminFetch } from './client';

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  lastLogin: string;
  attr: Record<string, unknown>;
}

export interface UserPage {
  total: number;
  items: User[];
}

export interface UserListParams {
  page: number;
  pageSize: number;
  query?: string;
  role?: string;
  createdAfter?: number;
  createdBefore?: number;
}

export type UserAction = 'restrict' | 'unrestrict' | 'ban' | 'unban';

export interface UserActionRequest {
  username: string;
  reason: string;
}

export async function getUsers(
  session: AuthSession,
  params: UserListParams,
): Promise<UserPage> {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.pageSize),
  });
  if (params.query) searchParams.set('q', `%${params.query}%`);
  if (params.role) searchParams.set('role', params.role);
  if (params.createdAfter !== undefined) {
    searchParams.set('created_after', String(params.createdAfter));
  }
  if (params.createdBefore !== undefined) {
    searchParams.set('created_before', String(params.createdBefore));
  }

  const response = await adminFetch(
    session,
    `/api/v1/admin/user?${searchParams}`,
  );

  return response.json() as Promise<UserPage>;
}

export async function updateUserRole(
  session: AuthSession,
  action: UserAction,
  request: UserActionRequest,
): Promise<void> {
  await adminFetch(session, `/api/v1/admin/user/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
}
