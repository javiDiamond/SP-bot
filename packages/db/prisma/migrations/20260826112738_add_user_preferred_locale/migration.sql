-- AlterTable: per-user UI language preference (e.g. 'en', 'fa').
-- NULL means "no preference" — the client falls back to cookie / browser detection.

ALTER TABLE "User" ADD COLUMN "preferredLocale" TEXT;
