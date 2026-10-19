import type { XUi } from '../classes';

export type XAsyncContentUi = XUi<
  | 'root'
  | 'loading'
  | 'spinner'
  | 'error'
  | 'empty'
  | 'icon'
  | 'title'
  | 'description'
  | 'retry'
>;

export interface XAsyncContentProps {
  /** 仅作用于内置状态界面，不修改调用方提供的插槽内容。 */
  ui?: XAsyncContentUi;
  loading: boolean;
  error?: string;
  empty?: boolean;
  errorTitle?: string;
  /** 提供回调时显示重试按钮。 */
  onRetry?: () => void;
  retryLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  size?: 'compact' | 'default' | 'large';
}
