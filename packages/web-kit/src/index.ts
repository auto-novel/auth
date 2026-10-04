import { createAuthApi, type AuthUser } from '@novelia/auth-api';
import { computed, readonly, ref, type App } from 'vue';

import WebKitApp from './components/WebKitApp.vue';
import WebKitLayout from './components/WebKitLayout.vue';
import MyStrikeListView from './views/MyStrikeListView.vue';
import XActionMenu from './ui/XActionMenu.vue';
import XActionMenuItem from './ui/XActionMenuItem.vue';
import XAsyncContent from './ui/XAsyncContent.vue';
import XButton from './ui/XButton.vue';
import XConfirmDialog from './ui/XConfirmDialog.vue';
import XPagination from './ui/XPagination.vue';
import XSelect from './ui/XSelect.vue';
import { useWebKit, useWebTheme, webKitKey } from './context';
import { attentionKey, createAttention } from './attentionContext';
import { createWebTheme } from './theme';
import { Notify } from './notifications';
import type { WebKit, WebKitOptions } from './types';

export function createWebKit(options: WebKitOptions): WebKit {
  const normalizedOptions = Object.freeze({
    auth: Object.freeze({
      ...options.auth,
      url: new URL(options.auth.url, window.location.origin).toString(),
    }),
    brand: options.brand,
    repository: options.repository
      ? Object.freeze({ ...options.repository })
      : undefined,
    strikes: Object.freeze({
      enabled: options.strikes?.enabled ?? true,
      to: options.strikes?.to ?? '/strikes',
    }),
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
  const attention = createAttention(api);
  const isSignedIn = computed(() => profile.value !== undefined);
  const theme = createWebTheme(
    normalizedOptions.themeStorageKey ??
      `${normalizedOptions.auth.app}-web-theme`,
  );

  function dispose() {
    attention.dispose();
    api.dispose();
  }

  const kit: WebKit = {
    options: normalizedOptions,
    api,
    profile: readonly(profile),
    isSignedIn,
    theme,
    install(app: App) {
      app.provide(webKitKey, kit);
      app.provide(attentionKey, attention.context);
      app.onUnmount(dispose);
    },
  };

  return kit;
}

export {
  MyStrikeListView,
  WebKitApp,
  WebKitLayout,
  XActionMenu,
  XActionMenuItem,
  XAsyncContent,
  XButton,
  XConfirmDialog,
  XPagination,
  XSelect,
  Notify,
  useWebKit,
  useWebTheme,
};
export type {
  WebKitMenuOption,
  WebKitOptions,
  WebKitStrikeOptions,
} from './types';
