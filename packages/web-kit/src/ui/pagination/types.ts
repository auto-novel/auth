export interface XPaginationProps {
  page: number;
  totalPages: number;
  /** 全局左右键翻页，默认关闭；同页仅启用一个分页条。 */
  keyboard?: boolean;
}
