import {
  jsonRequest,
  requestJson,
  requestVoid,
  type AccessTokenSession,
  type ApiRequestOptions,
} from './client';

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

function withSession(session: AccessTokenSession, options?: ApiRequestOptions) {
  return { ...options, session };
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

export function getUsers(
  session: AccessTokenSession,
  params: UserListParams,
  options?: ApiRequestOptions,
) {
  const searchParams = createPagination(params);
  if (params.query) searchParams.set('q', `%${params.query}%`);
  if (params.role) searchParams.set('role', params.role);
  setCreatedRange(searchParams, params);
  return requestJson<UserPage>(
    `admin/user?${searchParams}`,
    withSession(session, options),
  );
}

export function updateUserRole(
  session: AccessTokenSession,
  action: UserAction,
  request: UserActionRequest,
  options?: ApiRequestOptions,
) {
  return requestVoid(`admin/user/${action}`, {
    ...withSession(session, options),
    method: 'POST',
    ...jsonRequest(request),
  });
}

export function getOverview(
  session: AccessTokenSession,
  startDate: string,
  endDate: string,
  options?: ApiRequestOptions,
) {
  const searchParams = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  });
  return requestJson<Overview>(
    `admin/overview?${searchParams}`,
    withSession(session, options),
  );
}

export function getEvents(
  session: AccessTokenSession,
  params: EventListParams,
  options?: ApiRequestOptions,
) {
  const searchParams = createPagination(params);
  if (params.actorUser) searchParams.set('actor_user', params.actorUser);
  if (params.targetUser) searchParams.set('target_user', params.targetUser);
  params.actions?.forEach((action) => searchParams.append('action', action));
  setCreatedRange(searchParams, params);
  return requestJson<EventPage>(
    `admin/event?${searchParams}`,
    withSession(session, options),
  );
}

export function getAuthSettings(
  session: AccessTokenSession,
  options?: ApiRequestOptions,
) {
  return requestJson<AuthSettings>(
    'admin/setting',
    withSession(session, options),
  );
}

export function updateAuthSettings(
  session: AccessTokenSession,
  settings: UpdateAuthSettingsRequest,
  options?: ApiRequestOptions,
) {
  return requestJson<AuthSettings>('admin/setting', {
    ...withSession(session, options),
    method: 'POST',
    ...jsonRequest(settings),
  });
}

export function getStrikes(
  session: AccessTokenSession,
  params: StrikeListParams,
  options?: ApiRequestOptions,
) {
  const searchParams = createPagination(params);
  if (params.username) searchParams.set('username', params.username);
  if (params.operatorUsername) {
    searchParams.set('operator_username', params.operatorUsername);
  }
  setCreatedRange(searchParams, params);
  return requestJson<StrikePage>(
    `admin/strikes?${searchParams}`,
    withSession(session, options),
  );
}

export function createStrike(
  session: AccessTokenSession,
  request: CreateStrikeRequest,
  options?: ApiRequestOptions,
) {
  return requestJson<Strike>('admin/strikes', {
    ...withSession(session, options),
    method: 'POST',
    ...jsonRequest(request),
  });
}

export function revokeStrike(
  session: AccessTokenSession,
  strikeId: number,
  options?: ApiRequestOptions,
) {
  return requestJson<Strike>(`admin/strikes/${strikeId}/revoke`, {
    ...withSession(session, options),
    method: 'POST',
  });
}
