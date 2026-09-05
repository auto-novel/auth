import { inject, type InjectionKey } from 'vue';

import type { AuthApi } from '@novelia/auth-api';

interface Page<T> {
  total: number;
  items: T[];
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

export interface UserListParams {
  page: number;
  pageSize: number;
  createdAfter?: number;
  createdBefore?: number;
  query?: string;
  role?: string;
}

export type UserAction =
  'trust' | 'untrust' | 'restrict' | 'unrestrict' | 'ban' | 'unban';

interface UserRoleRequest {
  username: string;
}

interface UserRoleReasonRequest extends UserRoleRequest {
  reason: string;
}

export interface DailyAuthStat {
  date: string;
  loginCount: number;
  registerCount: number;
}

export interface AuthActivitySummary {
  loginCount: number;
  newUsers: number;
}

interface OverviewActivity {
  authActivity: DailyAuthStat[];
  summary: AuthActivitySummary;
  previousSummary: AuthActivitySummary;
}

export interface OverviewUserSummary {
  totalUsers: number;
  restrictedUsers: number;
  bannedUsers: number;
}

export interface Event {
  id: number;
  action: string;
  detail: Record<string, unknown>;
  createdAt: string;
}

interface EventListParams {
  page: number;
  pageSize: number;
  createdAfter?: number;
  createdBefore?: number;
  actorUser?: string;
  targetUser?: string;
  actions?: string[];
}

export interface AuthSettings {
  registerEnabled: boolean;
  resetPasswordEnabled: boolean;
  updatedAt: string;
}

interface UpdateAuthSettingsRequest {
  registerEnabled: boolean;
  resetPasswordEnabled: boolean;
}

interface StrikeListParams {
  page: number;
  pageSize: number;
  createdAfter?: number;
  createdBefore?: number;
  username?: string;
  operatorUsername?: string;
}

interface CreateStrikeRequest {
  username: string;
  reason: string;
  evidence: string;
  point: number;
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

export function createAdminApi(authApi: AuthApi) {
  const client = authApi.client;

  return {
    admin: {
      getUsers(params: UserListParams) {
        return client
          .get('admin/user', {
            searchParams: {
              page: params.page,
              page_size: params.pageSize,
              q: params.query ? `%${params.query}%` : undefined,
              role: params.role || undefined,
              created_after: params.createdAfter,
              created_before: params.createdBefore,
            },
          })
          .json<Page<User>>();
      },
      trustUser(request: UserRoleRequest) {
        return client.post('admin/user/trust', { json: request }).text();
      },
      untrustUser(request: UserRoleRequest) {
        return client.post('admin/user/untrust', { json: request }).text();
      },
      restrictUser(request: UserRoleReasonRequest) {
        return client.post('admin/user/restrict', { json: request }).text();
      },
      unrestrictUser(request: UserRoleReasonRequest) {
        return client.post('admin/user/unrestrict', { json: request }).text();
      },
      banUser(request: UserRoleReasonRequest) {
        return client.post('admin/user/ban', { json: request }).text();
      },
      unbanUser(request: UserRoleReasonRequest) {
        return client.post('admin/user/unban', { json: request }).text();
      },
      getOverviewActivity(startDate: string, endDate: string) {
        return client
          .get('admin/overview/activity', {
            searchParams: { start_date: startDate, end_date: endDate },
          })
          .json<OverviewActivity>();
      },
      getOverviewUserSummary() {
        return client
          .get('admin/overview/user-summary')
          .json<OverviewUserSummary>();
      },
      getEvents(params: EventListParams) {
        const searchParams: Array<[string, string | number]> = [
          ['page', params.page],
          ['page_size', params.pageSize],
        ];
        if (params.actorUser) {
          searchParams.push(['actor_user', params.actorUser]);
        }
        if (params.targetUser) {
          searchParams.push(['target_user', params.targetUser]);
        }
        if (params.createdAfter !== undefined) {
          searchParams.push(['created_after', params.createdAfter]);
        }
        if (params.createdBefore !== undefined) {
          searchParams.push(['created_before', params.createdBefore]);
        }
        for (const action of params.actions ?? []) {
          searchParams.push(['action', action]);
        }

        return client.get('admin/event', { searchParams }).json<Page<Event>>();
      },
      getAuthSettings() {
        return client.get('admin/setting').json<AuthSettings>();
      },
      updateAuthSettings(settings: UpdateAuthSettingsRequest) {
        return client
          .post('admin/setting', { json: settings })
          .json<AuthSettings>();
      },
      getStrikes(params: StrikeListParams) {
        return client
          .get('admin/strikes', {
            searchParams: {
              page: params.page,
              page_size: params.pageSize,
              username: params.username || undefined,
              operator_username: params.operatorUsername || undefined,
              created_after: params.createdAfter,
              created_before: params.createdBefore,
            },
          })
          .json<Page<Strike>>();
      },
      createStrike(request: CreateStrikeRequest) {
        return client.post('admin/strikes', { json: request }).json<Strike>();
      },
      revokeStrike(strikeId: number) {
        return client.post(`admin/strikes/${strikeId}/revoke`).json<Strike>();
      },
    },
  };
}

export type AdminApi = ReturnType<typeof createAdminApi>;

export const adminApiKey: InjectionKey<AdminApi> = Symbol('admin-api');

export function useAdminApi() {
  const api = inject(adminApiKey);
  if (!api) throw new Error('Admin API 尚未注册');
  return api;
}
