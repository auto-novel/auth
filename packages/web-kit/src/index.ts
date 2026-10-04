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
import {
  attentionKey,
  createAttention,
  useAttention,
} from './attentionContext';
import { createWebTheme } from './theme';
import {
  activateNotifications,
  createNotifications,
  Notify,
} from './notifications';
import { getApiErrorMessage } from './utils/apiError';
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
  const notifications = createNotifications();
  // 让独立的 `Notify` 导出写入最近创建的实例。
  activateNotifications(notifications);
  const isSignedIn = computed(() => profile.value !== undefined);
  const theme = createWebTheme(
    normalizedOptions.themeStorageKey ??
      `${normalizedOptions.auth.app}-web-theme`,
  );

  let disposed = false;
  function dispose() {
    if (disposed) return;
    disposed = true;
    attention.dispose();
    api.dispose();
  }

  const kit: WebKit = {
    options: normalizedOptions,
    api,
    profile: readonly(profile),
    isSignedIn,
    attention: attention.context,
    notifications,
    theme,
    dispose,
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
  attentionKey,
  getApiErrorMessage,
  useAttention,
  useWebKit,
  useWebTheme,
  webKitKey,
};
export type { AttentionContext } from './attentionContext';
export type { AppNotification, Notifications } from './notifications';
export type { WebTheme } from './theme';
export type {
  WebKit,
  WebKitContext,
  WebKitMenuOption,
  WebKitOptions,
  WebKitResolvedOptions,
  WebKitStrikeOptions,
} from './types';
export type {
  XActionMenuItemProps,
  XActionMenuProps,
  XAsyncContentProps,
  XButtonProps,
  XButtonSize,
  XButtonVariant,
  XConfirmDialogProps,
  XPaginationProps,
  XSelectOption,
  XSelectProps,
} from './ui/types';
