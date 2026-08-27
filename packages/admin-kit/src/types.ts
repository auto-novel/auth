import type { AuthApi, UserProfile } from '@novelia/auth-api';
import type { App, ComputedRef, DeepReadonly, Ref } from 'vue';

import type { AdminTheme } from './theme';

export interface AuthSession {
  profile: Readonly<Ref<UserProfile | undefined>>;
  isSignedIn: ComputedRef<boolean>;
  isAuthorized: ComputedRef<boolean>;
  initialize(): Promise<void>;
  refresh(): Promise<void>;
  logout(): Promise<void>;
}

export interface AdminKitOptions {
  auth: {
    app: string;
    url: string;
  };
  brand: string;
  repository?: {
    url: string;
    buildTime: string;
    commitSha: string;
  };
}

export interface AdminKitContext {
  options: DeepReadonly<AdminKitOptions>;
  api: AuthApi;
  session: AuthSession;
  theme: AdminTheme;
}

export interface AdminKit extends AdminKitContext {
  install(app: App): void;
}

export type { UserProfile } from '@novelia/auth-api';
