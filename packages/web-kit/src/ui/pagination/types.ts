import type { XUi } from '../classes';

export type XPaginationUi = XUi<
  | 'root'
  | 'list'
  | 'prev'
  | 'next'
  | 'item'
  | 'ellipsis'
  | 'summary'
  | 'jumpContent'
  | 'jumpLabel'
  | 'jumpInput'
  | 'jumpButton'
>;

/** class/style 与透传属性作用于分页导航根节点。 */
export interface XPaginationProps {
  ui?: XPaginationUi;
  page: number;
  totalPages: number;
  /** 全局左右键翻页，默认关闭；同页仅启用一个分页条。 */
  keyboard?: boolean;
}
