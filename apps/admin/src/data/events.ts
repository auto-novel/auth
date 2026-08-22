import type { AuthSession } from '@novelia/admin-kit';

import { adminFetch } from './client';

export interface Event {
  id: number;
  action: string;
  detail: string;
  createdAt: string;
}

export interface EventPage {
  total: number;
  items: Event[];
}

export interface EventListParams {
  page: number;
  pageSize: number;
  actorUser?: string;
  targetUser?: string;
  action?: string;
  createdAfter?: number;
  createdBefore?: number;
}

export async function getEvents(
  session: AuthSession,
  params: EventListParams,
): Promise<EventPage> {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.pageSize),
  });
  if (params.actorUser) searchParams.set('actor_user', params.actorUser);
  if (params.targetUser) searchParams.set('target_user', params.targetUser);
  if (params.action) searchParams.set('action', params.action);
  if (params.createdAfter !== undefined) {
    searchParams.set('created_after', String(params.createdAfter));
  }
  if (params.createdBefore !== undefined) {
    searchParams.set('created_before', String(params.createdBefore));
  }

  const response = await adminFetch(
    session,
    `/api/v1/admin/event?${searchParams}`,
  );
  return response.json() as Promise<EventPage>;
}
