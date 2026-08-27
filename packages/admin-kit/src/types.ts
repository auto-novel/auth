import type {
  ApiRequestOptions,
  AuthApi,
  UserProfile,
} from '@novelia/auth-api';
import type { ComputedRef, DeepReadonly, Plugin, Ref } from 'vue';

export interface AuthSession {
  profile: DeepReadonly<Ref<UserProfile | undefined>>;
  isSignedIn: ComputedRef<boolean>;
  isAuthorized: ComputedRef<boolean>;
  initialize(): Promise<void> | void;
  refresh(): Promise<void>;
  logout(): Promise<void>;
}

export interface AdminKitOptions {
  api: ApiRequestOptions;
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
  api: AuthApi;
  session: AuthSession;
}

export type AdminKit = Plugin;

export type { UserProfile } from '@novelia/auth-api';
