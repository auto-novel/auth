import type { ApiClient } from './client';
import type { Page } from './types';

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

export interface UserRoleRequest {
  username: string;
}

export interface UserRoleReasonRequest extends UserRoleRequest {
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

export interface OverviewActivity {
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

export type EventPage = Page<Event>;

export interface EventListParams {
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

export interface StrikeListParams {
  page: number;
  pageSize: number;
  createdAfter?: number;
  createdBefore?: number;
  username?: string;
  operatorUsername?: string;
}

export interface CreateStrikeRequest {
  username: string;
  reason: string;
  evidence: string;
  point: number;
}

export function createAdminEndpoints(client: ApiClient) {
  return {
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
        .json<UserPage>();
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

      return client.get('admin/event', { searchParams }).json<EventPage>();
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
        .json<StrikePage>();
    },
    createStrike(request: CreateStrikeRequest) {
      return client.post('admin/strikes', { json: request }).json<Strike>();
    },
    revokeStrike(strikeId: number) {
      return client.post(`admin/strikes/${strikeId}/revoke`).json<Strike>();
    },
  };
}
