import type { AuthApi, AuthUser } from '@novelia/auth-api';
import type { App, Component, ComputedRef, DeepReadonly, Ref } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

import type { WebTheme } from './theme';

export interface WebKitOptions {
  auth: {
    app: string;
    url: string;
    storageKey?: string;
  };
  brand: string;
  repository?: {
    url: string;
    buildTime: string;
    commitSha: string;
  };
  themeStorageKey?: string;
}

export interface WebKitMenuOption {
  key: string;
  label: string;
  icon: Component;
  to: RouteLocationRaw;
}

export interface WebKitContext {
  options: DeepReadonly<WebKitOptions>;
  api: AuthApi;
  profile: Readonly<Ref<AuthUser | undefined>>;
  isSignedIn: ComputedRef<boolean>;
  theme: WebTheme;
}

export interface WebKit extends WebKitContext {
  install(app: App): void;
}
