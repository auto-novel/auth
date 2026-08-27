import type { ApiClient } from './client';
import type { CreatedRangeParams, Page, PaginationParams } from './types';

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
    updateUserRole(action: UserAction, request: UserActionRequest) {
      return client.post(`admin/user/${action}`, request).void();
    },
    getOverview(startDate: string, endDate: string) {
      return client
        .get('admin/overview', {
          searchParams: { start_date: startDate, end_date: endDate },
        })
        .json<Overview>();
    },
    getEvents(params: EventListParams) {
      return client
        .get('admin/event', {
          searchParams: {
            page: params.page,
            page_size: params.pageSize,
            actor_user: params.actorUser || undefined,
            target_user: params.targetUser || undefined,
            action: params.actions,
            created_after: params.createdAfter,
            created_before: params.createdBefore,
          },
        })
        .json<EventPage>();
    },
    getAuthSettings() {
      return client.get('admin/setting').json<AuthSettings>();
    },
    updateAuthSettings(settings: UpdateAuthSettingsRequest) {
      return client.post('admin/setting', settings).json<AuthSettings>();
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
      return client.post('admin/strikes', request).json<Strike>();
    },
    revokeStrike(strikeId: number) {
      return client.post(`admin/strikes/${strikeId}/revoke`).json<Strike>();
    },
  };
}
