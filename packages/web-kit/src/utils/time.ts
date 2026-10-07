import { format, formatDistance, isValid, toDate } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/** XTime 接收入参：Date、毫秒时间戳，或可被 Date 解析的字符串。 */
export type XTimeValue = Date | number | string | null;

/** format 传该值时输出相对时间，而不是 date-fns 格式串。 */
export const TIME_RELATIVE_FORMAT = 'relative';

/** 默认的 date-fns 格式串。 */
export const TIME_DEFAULT_FORMAT = 'yyyy-MM-dd HH:mm:ss';

/** 转成有效 Date；空值或无法解析时返回 undefined。 */
export function timeValueToDate(
  value: XTimeValue | undefined,
): Date | undefined {
  if (value === null || value === undefined || value === '') return undefined;

  const parsed = toDate(value);

  return isValid(parsed) ? parsed : undefined;
}

/** 按 date-fns 格式串或相对时间（`relative`）输出文案。 */
export function formatTimeValue(
  date: Date,
  formatString: string,
  base?: XTimeValue | undefined,
): string {
  if (formatString === TIME_RELATIVE_FORMAT) {
    return formatDistance(date, timeValueToDate(base) ?? new Date(), {
      addSuffix: true,
      locale: zhCN,
    });
  }

  return format(date, formatString, { locale: zhCN });
}
