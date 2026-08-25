export interface PublishRecord {
  id: string;
  sessionId: string;
  platformExternalId: string;
  preparedAt: Date;
  openedAt: Date | null;
  completedAt: Date | null;
  userConfirmed: boolean;
  createdAt: Date;
  updatedAt: Date;
}
