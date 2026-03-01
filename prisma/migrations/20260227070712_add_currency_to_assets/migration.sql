-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BankAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "holderName" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT,
    "sortCode" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "currentBalance" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BankAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_BankAccount" ("accountNumber", "bankName", "createdAt", "currentBalance", "holderName", "id", "sortCode", "updatedAt", "userId") SELECT "accountNumber", "bankName", "createdAt", "currentBalance", "holderName", "id", "sortCode", "updatedAt", "userId" FROM "BankAccount";
DROP TABLE "BankAccount";
ALTER TABLE "new_BankAccount" RENAME TO "BankAccount";
CREATE INDEX "BankAccount_userId_idx" ON "BankAccount"("userId");
CREATE TABLE "new_Insurance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "insuredName" TEXT NOT NULL,
    "provider" TEXT,
    "policyType" TEXT,
    "policyNumber" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "sumAssured" REAL,
    "currentPayoutValue" REAL NOT NULL DEFAULT 0,
    "documentPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Insurance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Insurance" ("createdAt", "currentPayoutValue", "documentPath", "id", "insuredName", "policyNumber", "policyType", "provider", "sumAssured", "updatedAt", "userId") SELECT "createdAt", "currentPayoutValue", "documentPath", "id", "insuredName", "policyNumber", "policyType", "provider", "sumAssured", "updatedAt", "userId" FROM "Insurance";
DROP TABLE "Insurance";
ALTER TABLE "new_Insurance" RENAME TO "Insurance";
CREATE INDEX "Insurance_userId_idx" ON "Insurance"("userId");
CREATE TABLE "new_Loan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "loanType" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "loanAmount" REAL NOT NULL,
    "tenureYears" REAL,
    "startDate" TEXT,
    "monthlyPayment" REAL,
    "outstandingBalance" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Loan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Loan" ("createdAt", "id", "institution", "loanAmount", "loanType", "monthlyPayment", "outstandingBalance", "startDate", "tenureYears", "updatedAt", "userId") SELECT "createdAt", "id", "institution", "loanAmount", "loanType", "monthlyPayment", "outstandingBalance", "startDate", "tenureYears", "updatedAt", "userId" FROM "Loan";
DROP TABLE "Loan";
ALTER TABLE "new_Loan" RENAME TO "Loan";
CREATE INDEX "Loan_userId_idx" ON "Loan"("userId");
CREATE TABLE "new_Metal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "metalName" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "buyingPrice" REAL NOT NULL,
    "currentValue" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Metal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Metal" ("buyingPrice", "createdAt", "currentValue", "id", "metalName", "quantity", "updatedAt", "userId") SELECT "buyingPrice", "createdAt", "currentValue", "id", "metalName", "quantity", "updatedAt", "userId" FROM "Metal";
DROP TABLE "Metal";
ALTER TABLE "new_Metal" RENAME TO "Metal";
CREATE INDEX "Metal_userId_idx" ON "Metal"("userId");
CREATE TABLE "new_Pension" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "holderName" TEXT NOT NULL,
    "providerName" TEXT NOT NULL,
    "schemeName" TEXT,
    "address" TEXT,
    "accountNumber" TEXT,
    "contactInfo" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "currentValue" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pension_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Pension" ("accountNumber", "address", "contactInfo", "createdAt", "currentValue", "holderName", "id", "providerName", "schemeName", "updatedAt", "userId") SELECT "accountNumber", "address", "contactInfo", "createdAt", "currentValue", "holderName", "id", "providerName", "schemeName", "updatedAt", "userId" FROM "Pension";
DROP TABLE "Pension";
ALTER TABLE "new_Pension" RENAME TO "Pension";
CREATE INDEX "Pension_userId_idx" ON "Pension"("userId");
CREATE TABLE "new_RealEstate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "propertyType" TEXT,
    "address" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "purchasePrice" REAL NOT NULL,
    "currentValue" REAL,
    "mortgageAmount" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RealEstate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RealEstate" ("address", "createdAt", "currentValue", "id", "identifier", "mortgageAmount", "propertyType", "purchasePrice", "updatedAt", "userId") SELECT "address", "createdAt", "currentValue", "id", "identifier", "mortgageAmount", "propertyType", "purchasePrice", "updatedAt", "userId" FROM "RealEstate";
DROP TABLE "RealEstate";
ALTER TABLE "new_RealEstate" RENAME TO "RealEstate";
CREATE INDEX "RealEstate_userId_idx" ON "RealEstate"("userId");
CREATE TABLE "new_Stock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "purchaseDate" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "buyPrice" REAL NOT NULL,
    "quantity" REAL NOT NULL,
    "currentValue" REAL,
    "broker" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Stock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Stock" ("broker", "buyPrice", "createdAt", "currentValue", "id", "name", "purchaseDate", "quantity", "symbol", "updatedAt", "userId") SELECT "broker", "buyPrice", "createdAt", "currentValue", "id", "name", "purchaseDate", "quantity", "symbol", "updatedAt", "userId" FROM "Stock";
DROP TABLE "Stock";
ALTER TABLE "new_Stock" RENAME TO "Stock";
CREATE INDEX "Stock_userId_idx" ON "Stock"("userId");
CREATE TABLE "new_TermDeposit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "holderName" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "investmentType" TEXT NOT NULL DEFAULT 'Fixed deposit',
    "customType" TEXT,
    "accountNumber" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "amount" REAL NOT NULL DEFAULT 0,
    "annualRate" REAL,
    "interestFrequency" TEXT,
    "startDate" TEXT,
    "maturityDate" TEXT,
    "currentValue" REAL,
    "maturityValue" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TermDeposit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TermDeposit" ("accountNumber", "amount", "annualRate", "createdAt", "currentValue", "customType", "holderName", "id", "institution", "interestFrequency", "investmentType", "maturityDate", "maturityValue", "startDate", "updatedAt", "userId") SELECT "accountNumber", "amount", "annualRate", "createdAt", "currentValue", "customType", "holderName", "id", "institution", "interestFrequency", "investmentType", "maturityDate", "maturityValue", "startDate", "updatedAt", "userId" FROM "TermDeposit";
DROP TABLE "TermDeposit";
ALTER TABLE "new_TermDeposit" RENAME TO "TermDeposit";
CREATE INDEX "TermDeposit_userId_idx" ON "TermDeposit"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
