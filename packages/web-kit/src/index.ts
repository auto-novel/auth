import { createAuthApi, type AuthUser } from '@novelia/auth-api';
import { computed, readonly, ref, type App } from 'vue';

import WebKitLayout from './components/WebKitLayout.vue';
import XActionMenu from './ui/XActionMenu.vue';
import XActionMenuItem from './ui/XActionMenuItem.vue';
import XAsyncContent from './ui/XAsyncContent.vue';
import XButton from './ui/XButton.vue';
import XConfirmDialog from './ui/XConfirmDialog.vue';
import XPagination from './ui/XPagination.vue';
import XSelect from './ui/XSelect.vue';
import { useWebKit, useWebTheme, webKitKey } from './context';
import { createWebTheme } from './theme';
import type { WebKit, WebKitOptions } from './types';

export function createWebKit(options: WebKitOptions): WebKit {
  const normalizedOptions = Object.freeze({
    auth: Object.freeze({
      ...options.auth,
      url: new URL(options.auth.url, window.location.origin).toString(),
    }),
    brand: options.brand,
    forum: Object.freeze({
      ...options.forum,
      url: new URL(options.forum.url, window.location.origin).toString(),
    }),
    repository: options.repository
      ? Object.freeze({ ...options.repository })
      : undefined,
    themeStorageKey: options.themeStorageKey,
  });
  let storage: Storage | undefined;
  try {
    storage = window.localStorage;
  } catch {
    // Keep the session in memory when browser storage is blocked.
  }
  const api = createAuthApi({
    app: normalizedOptions.auth.app,
    url: normalizedOptions.auth.url,
    storage: storage
      ? {
          key:
            normalizedOptions.auth.storageKey ??
            `${normalizedOptions.auth.app}-session`,
          target: storage,
        }
      : undefined,
  });
  const profile = ref<AuthUser>();
  api.watchUser((user) => {
    profile.value = user;
  });
  const isSignedIn = computed(() => profile.value !== undefined);
  const theme = createWebTheme(
    normalizedOptions.themeStorageKey ??
      `${normalizedOptions.auth.app}-web-theme`,
  );
  const kit: WebKit = {
    options: normalizedOptions,
    api,
    profile: readonly(profile),
    isSignedIn,
    theme,
    install(app: App) {
      app.provide(webKitKey, kit);
      app.onUnmount(api.dispose);
    },
  };

  return kit;
}

export {
  WebKitLayout,
  XActionMenu,
  XActionMenuItem,
  XAsyncContent,
  XButton,
  XConfirmDialog,
  XPagination,
  XSelect,
  useWebKit,
  useWebTheme,
};
export type { WebKitMenuOption, WebKitOptions } from './types';
