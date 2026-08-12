-- CreateIndex
CREATE INDEX "notification_recipients_userId_isRead_isDeleted_idx" ON "notification_recipients"("userId", "isRead", "isDeleted");

-- CreateIndex
CREATE INDEX "units_isDeleted_idx" ON "units"("isDeleted");
