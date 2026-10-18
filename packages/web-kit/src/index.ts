import WebKitApp from './components/WebKitApp.vue';
import WebKitLayout from './components/WebKitLayout.vue';
import MyStrikeListView from './views/MyStrikeListView.vue';
import XActionMenu from './ui/action-menu/XActionMenu.vue';
import XActionMenuItem from './ui/action-menu/XActionMenuItem.vue';
import XAsyncContent from './ui/async-content/XAsyncContent.vue';
import XAspectRatio from './ui/aspect-ratio/XAspectRatio.vue';
import XSlider from './ui/slider/XSlider.vue';
import XSwitch from './ui/switch/XSwitch.vue';
import XButton from './ui/button/XButton.vue';
import XConfirmDialog from './ui/dialog/XConfirmDialog.vue';
import XDrawer from './ui/drawer/XDrawer.vue';
import XDropZone from './ui/drop-zone/XDropZone.vue';
import XDialog from './ui/dialog/XDialog.vue';
import XPagination from './ui/pagination/XPagination.vue';
import XSelect from './ui/select/XSelect.vue';
import XTime from './ui/time/XTime.vue';
import XTooltip from './ui/tooltip/XTooltip.vue';
import { useWebKit } from './context';
import { Toast } from './ui/toast';
import { getApiErrorMessage } from './ui/toast/apiError';

export { createWebKit } from './create';
export { copyToClipboard } from './utils/clipboard';
export { useWebKitViewport } from './utils/viewport';
export type { ViewportMode, WebKitViewport } from './utils/viewport';
export { isKnownRole, roleLabels, roles } from './auth/whoami';
export {
  useLocalStorage,
  useSessionStorage,
  useStorage,
} from './utils/storage';
export type { StoredRefOptions } from './utils/storage';
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
  XAspectRatio,
  XSlider,
  XSwitch,
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
export type { XAspectRatioProps } from './ui/aspect-ratio/types';
export type { XSliderProps } from './ui/slider/types';
export type { XSwitchProps } from './ui/switch/types';
export type { XDrawerProps } from './ui/drawer/types';
export type { XDropZoneProps } from './ui/drop-zone/types';
export type { XConfirmDialogProps, XDialogProps } from './ui/dialog/types';
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
} from './ui/action-menu/types';
export type { XAsyncContentProps } from './ui/async-content/types';
export type {
  XButtonProps,
  XButtonSize,
  XButtonVariant,
} from './ui/button/types';
export type { XSelectOption, XSelectProps } from './ui/select/types';
export type { XTooltipProps } from './ui/tooltip/types';
