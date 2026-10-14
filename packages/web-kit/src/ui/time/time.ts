import { format, formatDistanceStrict, isValid, toDate } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/** Date、毫秒时间戳或日期字符串。 */
export type XTimeValue = Date | number | string | null;

export const TIME_PRESETS = {
  date: 'yyyy年M月d日',
  'date-numeric': 'yyyy/MM/dd',
  datetime: 'yyyy年M月d日 HH:mm',
  'datetime-numeric': 'yyyy/MM/dd HH:mm',
  time: 'HH:mm:ss',
} as const;

export type XTimePreset = keyof typeof TIME_PRESETS | 'relative';

export interface XTimeProps {
  /** 默认完整时间（含秒），空字符串关闭提示。 */
  title?: string;
  /** 空值或非法值不渲染。 */
  time?: XTimeValue;
  /** 默认 datetime。 */
  preset?: XTimePreset;
  /** date-fns 格式串，优先于 preset。 */
  format?: string;
  /** 相对时间基准，默认当前时刻。 */
  to?: XTimeValue;
}

/** 转成有效 Date；空值或无法解析时返回 undefined。 */
export function timeValueToDate(
  value: XTimeValue | undefined,
): Date | undefined {
  if (value === null || value === undefined || value === '') return undefined;

  const parsed = toDate(value);

  return isValid(parsed) ? parsed : undefined;
}

export function formatTimeValue(date: Date, formatString: string): string {
  return format(date, formatString, { locale: zhCN });
}

/** 相对时间（如“3 分钟前”），base 默认当前时刻。 */
export function formatRelativeTime(
  date: Date,
  base?: XTimeValue | undefined,
): string {
  return formatDistanceStrict(date, timeValueToDate(base) ?? new Date(), {
    addSuffix: true,
    locale: zhCN,
  });
}
