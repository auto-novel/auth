import {
  createStrike,
  getAuthSettings,
  getEvents,
  getOverview,
  getStrikes,
  getUsers,
  revokeStrike,
  updateAuthSettings,
  updateUserRole,
} from './admin';
import {
  login,
  logout,
  refresh,
  register,
  requestOtp,
  resetPassword,
} from './auth';
import type { AccessTokenSession, ApiRequestOptions } from './client';
import { getMyStrikes } from './me';

export interface CreateAuthApiOptions extends ApiRequestOptions {
  session?: AccessTokenSession;
}

export function createAuthApi(options: CreateAuthApiOptions) {
  if (!options.baseUrl.trim()) throw new Error('必须配置 baseUrl');

  const { session, ...requestOptions } = options;

  function requireSession() {
    if (!session) throw new Error('调用受保护接口前必须配置 session');
    return session;
  }

  return {
    auth: {
      register: (request: Parameters<typeof register>[0]) =>
        register(request, requestOptions),
      login: (request: Parameters<typeof login>[0]) =>
        login(request, requestOptions),
      requestOtp: (request: Parameters<typeof requestOtp>[0]) =>
        requestOtp(request, requestOptions),
      resetPassword: (request: Parameters<typeof resetPassword>[0]) =>
        resetPassword(request, requestOptions),
      refresh: (app: string) => refresh(app, requestOptions),
      logout: () => logout(requestOptions),
    },
    admin: {
      getUsers: (params: Parameters<typeof getUsers>[1]) =>
        getUsers(requireSession(), params, requestOptions),
      updateUserRole: (
        action: Parameters<typeof updateUserRole>[1],
        request: Parameters<typeof updateUserRole>[2],
      ) => updateUserRole(requireSession(), action, request, requestOptions),
      getOverview: (startDate: string, endDate: string) =>
        getOverview(requireSession(), startDate, endDate, requestOptions),
      getEvents: (params: Parameters<typeof getEvents>[1]) =>
        getEvents(requireSession(), params, requestOptions),
      getAuthSettings: () => getAuthSettings(requireSession(), requestOptions),
      updateAuthSettings: (
        settings: Parameters<typeof updateAuthSettings>[1],
      ) => updateAuthSettings(requireSession(), settings, requestOptions),
      getStrikes: (params: Parameters<typeof getStrikes>[1]) =>
        getStrikes(requireSession(), params, requestOptions),
      createStrike: (request: Parameters<typeof createStrike>[1]) =>
        createStrike(requireSession(), request, requestOptions),
      revokeStrike: (strikeId: number) =>
        revokeStrike(requireSession(), strikeId, requestOptions),
    },
    me: {
      getStrikes: (params: Parameters<typeof getMyStrikes>[1]) =>
        getMyStrikes(requireSession(), params, requestOptions),
    },
  };
}

export type AuthApi = ReturnType<typeof createAuthApi>;
