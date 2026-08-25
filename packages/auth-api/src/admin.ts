import { jsonRequest, type ApiClient } from './client';

export interface Page<T> {
  total: number;
  items: T[];
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface CreatedRangeParams {
  createdAfter?: number;
  createdBefore?: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  lastLogin: string;
  attr: Record<string, unknown>;
}

export type UserPage = Page<User>;

export interface UserListParams extends PaginationParams, CreatedRangeParams {
  query?: string;
  role?: string;
}

export type UserAction = 'restrict' | 'unrestrict' | 'ban' | 'unban';

export interface UserActionRequest {
  username: string;
  reason: string;
}

export interface DailyAuthStat {
  date: string;
  loginCount: number;
  registerCount: number;
}

export interface Overview {
  authActivity: DailyAuthStat[];
}

export interface Event {
  id: number;
  action: string;
  detail: Record<string, unknown>;
  createdAt: string;
}

export type EventPage = Page<Event>;

export interface EventListParams extends PaginationParams, CreatedRangeParams {
  actorUser?: string;
  targetUser?: string;
  actions?: string[];
}

export interface AuthSettings {
  registerEnabled: boolean;
  resetPasswordEnabled: boolean;
  updatedAt: string;
}

export interface UpdateAuthSettingsRequest {
  registerEnabled: boolean;
  resetPasswordEnabled: boolean;
}

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

export type StrikePage = Page<Strike>;

export interface StrikeListParams extends PaginationParams, CreatedRangeParams {
  username?: string;
  operatorUsername?: string;
}

export interface CreateStrikeRequest {
  username: string;
  reason: string;
  evidence: string;
  point: number;
}

function setCreatedRange(
  searchParams: URLSearchParams,
  params: CreatedRangeParams,
) {
  if (params.createdAfter !== undefined) {
    searchParams.set('created_after', String(params.createdAfter));
  }
  if (params.createdBefore !== undefined) {
    searchParams.set('created_before', String(params.createdBefore));
  }
}

function createPagination(params: PaginationParams) {
  return new URLSearchParams({
    page: String(params.page),
    page_size: String(params.pageSize),
  });
}

export function createAdminEndpoints(client: ApiClient) {
  const get = <T>(path: string) =>
    client.json<T>(path, { authenticated: true });
  const post = async (path: string, body?: unknown) => {
    await client.request(path, {
      authenticated: true,
      method: 'POST',
      ...(body === undefined ? {} : jsonRequest(body)),
    });
  };
  const postJson = <T>(path: string, body: unknown) =>
    client.json<T>(path, {
      authenticated: true,
      method: 'POST',
      ...jsonRequest(body),
    });

  return {
    getUsers(params: UserListParams) {
      const searchParams = createPagination(params);
      if (params.query) searchParams.set('q', `%${params.query}%`);
      if (params.role) searchParams.set('role', params.role);
      setCreatedRange(searchParams, params);
      return get<UserPage>(`admin/user?${searchParams}`);
    },
    updateUserRole(action: UserAction, request: UserActionRequest) {
      return post(`admin/user/${action}`, request);
    },
    getOverview(startDate: string, endDate: string) {
      const searchParams = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
      });
      return get<Overview>(`admin/overview?${searchParams}`);
    },
    getEvents(params: EventListParams) {
      const searchParams = createPagination(params);
      if (params.actorUser) searchParams.set('actor_user', params.actorUser);
      if (params.targetUser) searchParams.set('target_user', params.targetUser);
      params.actions?.forEach((action) =>
        searchParams.append('action', action),
      );
      setCreatedRange(searchParams, params);
      return get<EventPage>(`admin/event?${searchParams}`);
    },
    getAuthSettings: () => get<AuthSettings>('admin/setting'),
    updateAuthSettings: (settings: UpdateAuthSettingsRequest) =>
      postJson<AuthSettings>('admin/setting', settings),
    getStrikes(params: StrikeListParams) {
      const searchParams = createPagination(params);
      if (params.username) searchParams.set('username', params.username);
      if (params.operatorUsername) {
        searchParams.set('operator_username', params.operatorUsername);
      }
      setCreatedRange(searchParams, params);
      return get<StrikePage>(`admin/strikes?${searchParams}`);
    },
    createStrike: (request: CreateStrikeRequest) =>
      postJson<Strike>('admin/strikes', request),
    revokeStrike: (strikeId: number) =>
      client.json<Strike>(`admin/strikes/${strikeId}/revoke`, {
        authenticated: true,
        method: 'POST',
      }),
  };
}
