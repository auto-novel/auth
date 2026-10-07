import type { WebKitMenuOption } from './types';

export function externalLinkAttrs(
  option: Extract<WebKitMenuOption, { type: 'external' }>,
) {
  const newTab = option.target === '_blank';
  return {
    href: option.href,
    target: option.target ?? '_self',
    rel: newTab ? 'noopener noreferrer' : undefined,
    'aria-label': newTab ? `${option.label}（在新标签页打开）` : option.label,
  };
}

export function selectedGroupKeys(
  options: WebKitMenuOption[],
  selected?: string,
): string[] | undefined {
  if (selected === undefined) return;
  for (const option of options) {
    if (option.type === 'group') {
      const children = selectedGroupKeys(option.children, selected);
      if (children) return [option.key, ...children];
    } else if (option.type !== 'divider' && option.key === selected) {
      return [];
    }
  }
}
