import { format, formatDistanceStrict, isValid, toDate } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/** XTime 接收入参：Date、毫秒时间戳，或可被 Date 解析的字符串。 */
export type XTimeValue = Date | number | string | null;

/** 常用格式的预设，值为对应的 date-fns 格式串。 */
export const TIME_PRESETS = {
  date: 'yyyy年M月d日',
  'date-numeric': 'yyyy/MM/dd',
  datetime: 'yyyy年M月d日 HH:mm',
  'datetime-numeric': 'yyyy/MM/dd HH:mm',
  time: 'HH:mm:ss',
} as const;

/** 预设名；`relative` 输出相对时间，不对应格式串。 */
export type XTimePreset = keyof typeof TIME_PRESETS | 'relative';

/** 转成有效 Date；空值或无法解析时返回 undefined。 */
export function timeValueToDate(
  value: XTimeValue | undefined,
): Date | undefined {
  if (value === null || value === undefined || value === '') return undefined;

  const parsed = toDate(value);

  return isValid(parsed) ? parsed : undefined;
}

/** 按 date-fns 格式串输出文案。 */
export function formatTimeValue(date: Date, formatString: string): string {
  return format(date, formatString, { locale: zhCN });
}

/** 输出相对时间（如“3 分钟前”），base 默认当前时刻。 */
export function formatRelativeTime(
  date: Date,
  base?: XTimeValue | undefined,
): string {
  return formatDistanceStrict(date, timeValueToDate(base) ?? new Date(), {
    addSuffix: true,
    locale: zhCN,
  });
}
