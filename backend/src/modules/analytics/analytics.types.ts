export interface AnalyticsEventRecord {
  id: string;
  merchantId: string;
  storeId: string | null;
  sessionId: string | null;
  name: string;
  payload: Record<string, unknown>;
  createdAt: Date;
}

export interface TrackEventInput {
  merchantId: string;
  storeId?: string;
  sessionId?: string;
  name: string;
  payload?: Record<string, unknown>;
}

export interface AnalyticsFilter {
  merchantId: string;
  storeId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}
