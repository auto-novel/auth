import type { AuthSession } from '@novelia/admin-kit';

import { adminFetch } from './client';

export interface DailyAuthStat {
  date: string;
  loginCount: number;
  registerCount: number;
}

export interface Overview {
  authActivity: DailyAuthStat[];
}

export async function getOverview(
  session: AuthSession,
  startDate: string,
  endDate: string,
): Promise<Overview> {
  const searchParams = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  });
  const response = await adminFetch(
    session,
    `/api/v1/admin/overview?${searchParams}`,
  );

  return response.json() as Promise<Overview>;
}
