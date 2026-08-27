import { createAdminEndpoints } from './admin';
import { createAuthEndpoints, parseAccessToken } from './auth';
import {
  createApiClient,
  type AccessTokenSession,
  type ApiRequestOptions,
} from './client';
import { createMeEndpoints } from './me';

export interface CreateAuthApiOptions extends ApiRequestOptions {
  session?: AccessTokenSession;
}

const ACCESS_TOKEN_REFRESH_INTERVAL = 15 * 60 * 1000;
const ACCESS_TOKEN_REFRESH_AGE = 60 * 60 * 1000;

function startAccessTokenRefresh(session?: AccessTokenSession) {
  if (!session) return;

  return globalThis.setInterval(() => {
    const token = session.getAccessToken();
    if (!token) return;

    try {
      const { issuedAt } = parseAccessToken(token);
      if (Date.now() - issuedAt * 1000 >= ACCESS_TOKEN_REFRESH_AGE) {
        void session.refreshAccessToken().catch(() => undefined);
      }
    } catch {
      // Invalid tokens are handled by authenticated requests.
    }
  }, ACCESS_TOKEN_REFRESH_INTERVAL);
}

export function createAuthApi(options: CreateAuthApiOptions) {
  const client = createApiClient(options);
  const refreshTimer = startAccessTokenRefresh(options.session);

  return {
    auth: createAuthEndpoints(client, options.timeout ?? 5000),
    admin: createAdminEndpoints(client),
    me: createMeEndpoints(client),
    dispose() {
      if (refreshTimer !== undefined) globalThis.clearInterval(refreshTimer);
    },
  };
}

export type AuthApi = ReturnType<typeof createAuthApi>;
