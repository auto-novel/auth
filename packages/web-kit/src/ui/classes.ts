import { twMerge } from 'tailwind-merge';
import { normalizeClass } from 'vue';

/** 与 Vue class 绑定一致的字符串、数组和条件对象。 */
export type XClassValue =
  | string
  | false
  | null
  | undefined
  | Record<string, boolean | null | undefined>
  | readonly XClassValue[];

/** 组件公开的样式分区；仅接受该组件声明的区域名。 */
export type XUi<Part extends string> = Partial<Record<Part, XClassValue>>;

/** 默认样式在前，ui 覆盖居中，主要节点的 class 最后生效。 */
export function mergeClasses(...values: unknown[]): string {
  return twMerge(normalizeClass(values));
}
