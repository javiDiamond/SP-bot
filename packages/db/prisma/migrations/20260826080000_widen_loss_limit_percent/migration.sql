-- AlterColumns: store loss limits as percent values (e.g. 5 = 5%).
-- DECIMAL(5,4) capped at 9.9999 which cannot represent 10%+; widen to DECIMAL(7,4).

ALTER TABLE "Bot" ALTER COLUMN "dailyLossLimitPercent" SET DATA TYPE DECIMAL(7,4);

ALTER TABLE "RiskSetting" ALTER COLUMN "maxDailyLossPercent" SET DATA TYPE DECIMAL(7,4);
