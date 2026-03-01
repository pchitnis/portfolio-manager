-- AlterTable
ALTER TABLE "TermDeposit" ADD COLUMN "annualRate" REAL;
ALTER TABLE "TermDeposit" ADD COLUMN "interestFrequency" TEXT;
ALTER TABLE "TermDeposit" ADD COLUMN "maturityValue" REAL;
ALTER TABLE "TermDeposit" ADD COLUMN "startDate" TEXT;
