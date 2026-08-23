import type { AuthSession } from '@novelia/admin-kit';

import { adminFetch } from './client';

export interface AuthSettings {
  registerEnabled: boolean;
  resetPasswordEnabled: boolean;
  updatedAt: string;
}

export interface UpdateAuthSettingsRequest {
  registerEnabled: boolean;
  resetPasswordEnabled: boolean;
}

export async function getAuthSettings(
  session: AuthSession,
): Promise<AuthSettings> {
  const response = await adminFetch(session, '/api/v1/admin/setting');
  return response.json() as Promise<AuthSettings>;
}

export async function updateAuthSettings(
  session: AuthSession,
  settings: UpdateAuthSettingsRequest,
): Promise<AuthSettings> {
  const response = await adminFetch(session, '/api/v1/admin/setting', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  return response.json() as Promise<AuthSettings>;
}
