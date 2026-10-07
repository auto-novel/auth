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
import XTime from './ui/XTime.vue';
import XTooltip from './ui/XTooltip.vue';
import { useWebKit, webKitKey } from './context';
import { Notify } from './notifications';
import { getApiErrorMessage } from './utils/apiError';
import { useWebKitLayout } from './layoutContext';

export { createWebKit } from './create';
export {
  createAuthApi,
  AuthUser,
  isKnownRole,
  isRoleAtLeast,
  roleLabels,
  roles,
  type AttentionStatus,
  type AuthApi,
  type AuthApiOptions,
  type AuthClientOptions,
  type BanUserRequest,
  type CreateStrikeRequest,
  type CreateStrikeResponse,
  type MyStrike,
  type MyStrikeListParams,
  type MyStrikePage,
  type StrikeReadState,
  type UserRole,
} from './auth/index';

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
  XTime,
  XTooltip,
  Notify,
  getApiErrorMessage,
  useWebKit,
  useWebKitLayout,
  webKitKey,
};
export type { AttentionContext } from './attentionContext';
export type { LayoutContext } from './layoutContext';
export type { AppNotification } from './notifications';
export type { WebTheme } from './theme';
export type {
  WebKit,
  WebKitContext,
  WebKitMenuOption,
  WebKitOptions,
  WebKitResolvedOptions,
  WebKitStrikeOptions,
  Whoami,
  WhoamiUser,
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
