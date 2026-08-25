import type { AccessTokenSession, UserProfile } from '@novelia/auth-api';
import type { ComputedRef, DeepReadonly, Plugin, Ref } from 'vue';

export interface AuthSession extends AccessTokenSession {
  profile: DeepReadonly<Ref<UserProfile | undefined>>;
  isSignedIn: ComputedRef<boolean>;
  isAuthorized: ComputedRef<boolean>;
  initialize(): Promise<void> | void;
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
  options: Readonly<AdminKitOptions>;
  session: AuthSession;
}

export type AdminKit = Plugin;

export type { UserProfile } from '@novelia/auth-api';
