import WebKitApp from './components/WebKitApp.vue';
import WebKitLayout from './components/WebKitLayout.vue';
import MyStrikeListView from './views/MyStrikeListView.vue';
import XActionMenu from './ui/XActionMenu.vue';
import XActionMenuItem from './ui/XActionMenuItem.vue';
import XAsyncContent from './ui/XAsyncContent.vue';
import XButton from './ui/XButton.vue';
import XConfirmDialog from './ui/XConfirmDialog.vue';
import XDrawer from './ui/drawer/XDrawer.vue';
import XPagination from './ui/XPagination.vue';
import XSelect from './ui/XSelect.vue';
import XTime from './ui/XTime.vue';
import XTooltip from './ui/XTooltip.vue';
import { useWebKit } from './context';
import { Toast } from './ui/toast';
import { getApiErrorMessage } from './ui/toast/apiError';

export { createWebKit } from './create';
export { copyToClipboard } from './utils/clipboard';
export { useWebKitViewport } from './utils/viewport';
export type { ViewportMode, WebKitViewport } from './utils/viewport';
export { isKnownRole, roleLabels, roles } from './auth/whoami';
export { useLocalStorage, useSessionStorage, useStorage } from './storage';
export type { StoredRefOptions } from './storage';
export type { ApiClientOptions as AuthClientOptions } from './api/client';
export type {
  AttentionStatus,
  BanUserRequest,
  CreateStrikeRequest,
  CreateStrikeResponse,
  MyStrike,
  MyStrikeListParams,
  MyStrikePage,
  StrikeReadState,
} from './api/requests';

export {
  MyStrikeListView,
  WebKitApp,
  WebKitLayout,
  XActionMenu,
  XActionMenuItem,
  XAsyncContent,
  XButton,
  XConfirmDialog,
  XDrawer,
  XPagination,
  XSelect,
  XTime,
  XTooltip,
  Toast,
  getApiErrorMessage,
  useWebKit,
};
export type {
  ToastId,
  ToastMessage,
  ToastOptions,
  ToastPromiseMessages,
  ToastStatus,
  ToastUpdateOptions,
} from './ui/toast';
export type { XDrawerProps } from './ui/drawer/types';
export type { Theme, ThemeOverride, ThemePreference, WebTheme } from './theme';
export type { UserRole, Whoami, WhoamiUser } from './auth/whoami';
export type {
  WebKit,
  WebKitContext,
  WebKitMenuOption,
  WebKitOptions,
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
  XTimePreset,
  XTimeProps,
  XTimeValue,
  XTooltipProps,
} from './ui/types';
