import WebKitApp from './components/WebKitApp.vue';
import WebKitLayout from './components/WebKitLayout.vue';
import MyStrikeListView from './views/MyStrikeListView.vue';
import XActionMenu from './ui/XActionMenu.vue';
import XActionMenuItem from './ui/XActionMenuItem.vue';
import XAsyncContent from './ui/XAsyncContent.vue';
import XButton from './ui/XButton.vue';
import XConfirmDialog from './ui/XConfirmDialog.vue';
import XDrawer from './ui/drawer/XDrawer.vue';
import XDropZone from './ui/drop-zone/XDropZone.vue';
import XDialog from './ui/dialog/XDialog.vue';
import XPagination from './ui/pagination/XPagination.vue';
import XSelect from './ui/XSelect.vue';
import XTime from './ui/time/XTime.vue';
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
export { useUploadProgress, uploadFile, UploadError } from './utils/upload';
export type {
  UploadFileOptions,
  UploadProgress,
  UploadProgressEvent,
  UploadProgressItem,
  UploadRequestOptions,
  UploadStatus,
} from './utils/upload';
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
  XDropZone,
  XDialog,
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
export type { XDropZoneProps } from './ui/drop-zone/types';
export type { XDialogProps } from './ui/dialog/types';
export type { XPaginationProps } from './ui/pagination/types';
export type { XTimePreset, XTimeProps, XTimeValue } from './ui/time/time';
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
  XSelectOption,
  XSelectProps,
  XTooltipProps,
} from './ui/types';
