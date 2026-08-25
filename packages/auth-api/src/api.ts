import { createAdminEndpoints } from './admin';
import { createAuthEndpoints } from './auth';
import {
  createApiClient,
  type AccessTokenSession,
  type ApiRequestOptions,
} from './client';
import { createMeEndpoints } from './me';

export interface CreateAuthApiOptions extends ApiRequestOptions {
  session?: AccessTokenSession;
}

export function createAuthApi(options: CreateAuthApiOptions) {
  const client = createApiClient(options);

  return {
    auth: createAuthEndpoints(client, options.timeout ?? 5000),
    admin: createAdminEndpoints(client),
    me: createMeEndpoints(client),
  };
}

export type AuthApi = ReturnType<typeof createAuthApi>;
