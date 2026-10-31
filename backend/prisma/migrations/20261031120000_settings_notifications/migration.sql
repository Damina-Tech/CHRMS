-- Global rental due-day settings
CREATE TABLE "AppSetting" (
    "id" TEXT NOT NULL,
    "rental_due_day" INTEGER NOT NULL DEFAULT 5,
    "reminder_days_before" INTEGER NOT NULL DEFAULT 5,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("id")
);

INSERT INTO "AppSetting" ("id", "rental_due_day", "reminder_days_before", "updated_at")
VALUES ('default', 5, 5, CURRENT_TIMESTAMP);

-- In-app notifications (due reminders / overdue)
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "dedupe_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Notification_dedupe_key_key" ON "Notification"("dedupe_key");
