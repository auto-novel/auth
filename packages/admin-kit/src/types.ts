import type { AuthApi, AuthUser } from '@novelia/auth-api';
import type { App, ComputedRef, DeepReadonly, Ref } from 'vue';

import type { AdminTheme } from './theme';

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
  profile: Readonly<Ref<AuthUser | undefined>>;
  isSignedIn: ComputedRef<boolean>;
  isAuthorized: ComputedRef<boolean>;
  theme: AdminTheme;
}

export interface AdminKit extends AdminKitContext {
  install(app: App): void;
}
