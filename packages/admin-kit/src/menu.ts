import type { RouteLocationRaw, Router } from 'vue-router';

import type { AdminKitMenuOption } from './types';

export function selectAdminMenuOption(
  option: AdminKitMenuOption,
  navigate: (to: RouteLocationRaw) => unknown,
) {
  if (option.disabled || option.show === false || option.children) return;
  if (option.to !== undefined) void navigate(option.to);
  else option.onSelect();
}

export function getAdminMenuActiveKey(
  options: AdminKitMenuOption[],
  router: Pick<Router, 'resolve'>,
  path: string,
): string | number | null {
  for (const option of options) {
    if (option.show === false) continue;
    if (option.children) {
      const key = getAdminMenuActiveKey(option.children, router, path);
      if (key !== null) return key;
    } else if (
      option.to !== undefined &&
      router.resolve(option.to).path === path
    ) {
      return option.key;
    }
  }
  return null;
}
