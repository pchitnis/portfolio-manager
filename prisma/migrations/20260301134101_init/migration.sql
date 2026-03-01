-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobile" TEXT,
    "password" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'US',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "holderName" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT,
    "sortCode" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "currentBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TermDeposit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "holderName" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "investmentType" TEXT NOT NULL DEFAULT 'Fixed deposit',
    "customType" TEXT,
    "accountNumber" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "annualRate" DOUBLE PRECISION,
    "interestFrequency" TEXT,
    "startDate" TEXT,
    "maturityDate" TEXT,
    "currentValue" DOUBLE PRECISION,
    "maturityValue" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TermDeposit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stock" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "purchaseDate" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "buyPrice" DOUBLE PRECISION NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "currentValue" DOUBLE PRECISION,
    "broker" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Metal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "metalName" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "buyingPrice" DOUBLE PRECISION NOT NULL,
    "currentValue" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Metal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RealEstate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "propertyType" TEXT,
    "address" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "purchasePrice" DOUBLE PRECISION NOT NULL,
    "currentValue" DOUBLE PRECISION,
    "mortgageAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RealEstate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pension" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "holderName" TEXT NOT NULL,
    "providerName" TEXT NOT NULL,
    "schemeName" TEXT,
    "address" TEXT,
    "accountNumber" TEXT,
    "contactInfo" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "currentValue" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Loan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "holderName" TEXT,
    "institution" TEXT NOT NULL,
    "loanType" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "loanAmount" DOUBLE PRECISION NOT NULL,
    "tenureYears" DOUBLE PRECISION,
    "startDate" TEXT,
    "monthlyPayment" DOUBLE PRECISION,
    "outstandingBalance" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Insurance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "insuredName" TEXT NOT NULL,
    "provider" TEXT,
    "policyType" TEXT,
    "policyNumber" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "sumAssured" DOUBLE PRECISION,
    "currentPayoutValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "documentPath" TEXT,
    "premiumAmount" DOUBLE PRECISION,
    "paymentFrequency" TEXT,
    "paymentDay" TEXT,
    "paymentMonth" TEXT,
    "paymentQMonth1" TEXT,
    "paymentQMonth2" TEXT,
    "paymentQMonth3" TEXT,
    "paymentQMonth4" TEXT,
    "nextDueDate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Insurance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashFlowEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "categoryType" TEXT,
    "fiscalYear" INTEGER NOT NULL,
    "apr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "may" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "jun" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "jul" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aug" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sep" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "oct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nov" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dec" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "jan" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "feb" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashFlowEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "BankAccount_userId_idx" ON "BankAccount"("userId");

-- CreateIndex
CREATE INDEX "BankAccount_userId_currency_idx" ON "BankAccount"("userId", "currency");

-- CreateIndex
CREATE INDEX "TermDeposit_userId_idx" ON "TermDeposit"("userId");

-- CreateIndex
CREATE INDEX "TermDeposit_userId_maturityDate_idx" ON "TermDeposit"("userId", "maturityDate");

-- CreateIndex
CREATE INDEX "TermDeposit_userId_investmentType_idx" ON "TermDeposit"("userId", "investmentType");

-- CreateIndex
CREATE INDEX "Stock_userId_idx" ON "Stock"("userId");

-- CreateIndex
CREATE INDEX "Stock_userId_symbol_idx" ON "Stock"("userId", "symbol");

-- CreateIndex
CREATE INDEX "Metal_userId_idx" ON "Metal"("userId");

-- CreateIndex
CREATE INDEX "Metal_userId_metalName_idx" ON "Metal"("userId", "metalName");

-- CreateIndex
CREATE INDEX "RealEstate_userId_idx" ON "RealEstate"("userId");

-- CreateIndex
CREATE INDEX "RealEstate_userId_propertyType_idx" ON "RealEstate"("userId", "propertyType");

-- CreateIndex
CREATE INDEX "Pension_userId_idx" ON "Pension"("userId");

-- CreateIndex
CREATE INDEX "Loan_userId_idx" ON "Loan"("userId");

-- CreateIndex
CREATE INDEX "Loan_userId_loanType_idx" ON "Loan"("userId", "loanType");

-- CreateIndex
CREATE INDEX "Insurance_userId_idx" ON "Insurance"("userId");

-- CreateIndex
CREATE INDEX "Insurance_userId_policyType_idx" ON "Insurance"("userId", "policyType");

-- CreateIndex
CREATE INDEX "Insurance_userId_nextDueDate_idx" ON "Insurance"("userId", "nextDueDate");

-- CreateIndex
CREATE INDEX "CashFlowEntry_userId_idx" ON "CashFlowEntry"("userId");

-- CreateIndex
CREATE INDEX "CashFlowEntry_userId_fiscalYear_idx" ON "CashFlowEntry"("userId", "fiscalYear");

-- CreateIndex
CREATE INDEX "CashFlowEntry_userId_type_idx" ON "CashFlowEntry"("userId", "type");

-- CreateIndex
CREATE INDEX "CashFlowEntry_userId_type_fiscalYear_idx" ON "CashFlowEntry"("userId", "type", "fiscalYear");

-- CreateIndex
CREATE UNIQUE INDEX "CashFlowEntry_userId_type_category_fiscalYear_key" ON "CashFlowEntry"("userId", "type", "category", "fiscalYear");

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TermDeposit" ADD CONSTRAINT "TermDeposit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metal" ADD CONSTRAINT "Metal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RealEstate" ADD CONSTRAINT "RealEstate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pension" ADD CONSTRAINT "Pension_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Insurance" ADD CONSTRAINT "Insurance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashFlowEntry" ADD CONSTRAINT "CashFlowEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
