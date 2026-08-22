import type { AuthSession } from '@novelia/admin-kit';

import { adminFetch } from './client';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: number;
  lastLogin: number;
  attr: string;
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
