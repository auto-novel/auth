import { nextTick } from 'vue';

/**
 * 等待缓存页面及响应式布局更新后，返回可供路由 scrollBehavior 使用的位置。
 * 调用方负责判断导航是否仍有效；失效时返回 false，避免干扰新页面。
 */
export async function restoreScrollPosition(
  position: { top: number; left: number },
  isCurrentNavigation: () => boolean,
) {
  await nextTick();
  // 第一帧触发布局/ResizeObserver，第二帧执行 RAF 尺寸更新，
  // 第三帧再恢复，避免位置被尚未稳定的页面高度截断或滚动锚定修正。
  for (let frame = 0; frame < 3; frame++) {
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    if (!isCurrentNavigation()) return false;
  }
  return { ...position, behavior: 'instant' as const };
}
