/** 复制文本到剪贴板；需在安全上下文中由用户操作触发，失败时抛出错误。 */
export async function copyToClipboard(text: string): Promise<void> {
  if (
    typeof navigator === 'undefined' ||
    typeof navigator.clipboard?.writeText !== 'function'
  ) {
    throw new Error('Clipboard API is unavailable.');
  }
  await navigator.clipboard.writeText(text);
}
