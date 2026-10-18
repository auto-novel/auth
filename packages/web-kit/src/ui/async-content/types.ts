export interface XAsyncContentProps {
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
