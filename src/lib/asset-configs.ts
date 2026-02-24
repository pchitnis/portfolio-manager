export type FieldType = "text" | "number" | "date" | "select" | "file";

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
  allowCustom?: boolean;
  defaultValue?: string | number;
  autoCalc?: string; // formula description
  readOnly?: boolean;
}

export interface AssetTypeConfig {
  key: string;
  label: string;
  pluralLabel: string;
  prismaModel: string;
  gridColumns: { key: string; label: string }[];
  fields: FieldConfig[];
}

export const assetConfigs: Record<string, AssetTypeConfig> = {
  "bank-accounts": {
    key: "bank-accounts",
    label: "Bank Account",
    pluralLabel: "Bank Accounts",
    prismaModel: "bankAccount",
    gridColumns: [
      { key: "bankName", label: "Bank Name" },
      { key: "currentBalance", label: "Current Balance" },
    ],
    fields: [
      { name: "holderName", label: "Account Holder Name", type: "text", required: true, placeholder: "Enter account holder name" },
      { name: "bankName", label: "Bank Name", type: "text", required: true, placeholder: "Enter bank name" },
      { name: "accountNumber", label: "Account Number", type: "text", required: false, placeholder: "Enter account number" },
      { name: "sortCode", label: "Sort Code", type: "text", required: false, placeholder: "Enter sort code" },
      { name: "currentBalance", label: "Current Balance", type: "number", required: true, defaultValue: 0, placeholder: "0.00" },
    ],
  },
  "term-deposits": {
    key: "term-deposits",
    label: "Term Deposit",
    pluralLabel: "Term Deposits",
    prismaModel: "termDeposit",
    gridColumns: [
      { key: "institution", label: "Institution Name" },
      { key: "currentValue", label: "Current Balance" },
    ],
    fields: [
      { name: "holderName", label: "Account Holder Name", type: "text", required: true, placeholder: "Enter account holder name" },
      { name: "institution", label: "Institution Name", type: "text", required: true, placeholder: "Enter institution name" },
      { name: "investmentType", label: "Type of Investment", type: "select", required: true, options: ["Fixed deposit", "ISA", "Bonds", "Custom"], allowCustom: true },
      { name: "customType", label: "Custom Type", type: "text", required: false, placeholder: "Enter custom type" },
      { name: "accountNumber", label: "Account Number", type: "text", required: false, placeholder: "Enter account number" },
      { name: "amount", label: "Amount", type: "number", required: true, defaultValue: 0, placeholder: "0.00" },
      { name: "maturityDate", label: "Maturity Date", type: "date", required: false },
      { name: "currentValue", label: "Current Value", type: "number", required: false, placeholder: "Defaults to amount" },
    ],
  },
  stocks: {
    key: "stocks",
    label: "Stock / Mutual Fund",
    pluralLabel: "Stocks & Mutual Funds",
    prismaModel: "stock",
    gridColumns: [
      { key: "name", label: "Stock Name" },
      { key: "currentValue", label: "Current Value" },
    ],
    fields: [
      { name: "name", label: "Stock / Mutual Fund Name", type: "text", required: true, placeholder: "Enter stock or fund name" },
      { name: "symbol", label: "Symbol", type: "text", required: true, placeholder: "e.g. AAPL, MSFT" },
      { name: "purchaseDate", label: "Date of Purchase", type: "date", required: false },
      { name: "buyPrice", label: "Buy Price", type: "number", required: true, placeholder: "0.00" },
      { name: "quantity", label: "Quantity", type: "number", required: true, placeholder: "0" },
      { name: "currentValue", label: "Current Value", type: "number", required: false, placeholder: "Fetched from Yahoo Finance", readOnly: true },
      { name: "broker", label: "Broker", type: "text", required: false, placeholder: "Enter broker name" },
    ],
  },
  metals: {
    key: "metals",
    label: "Metal",
    pluralLabel: "Metals",
    prismaModel: "metal",
    gridColumns: [
      { key: "metalName", label: "Metal Name" },
      { key: "currentValue", label: "Current Value" },
    ],
    fields: [
      { name: "metalName", label: "Metal Name", type: "text", required: true, placeholder: "e.g. Gold, Silver" },
      { name: "quantity", label: "Quantity", type: "number", required: true, placeholder: "0" },
      { name: "buyingPrice", label: "Buying Price (per unit)", type: "number", required: true, placeholder: "0.00" },
      { name: "currentValue", label: "Current Value", type: "number", required: false, placeholder: "Defaults to total buy price" },
    ],
  },
  "real-estate": {
    key: "real-estate",
    label: "Property",
    pluralLabel: "Real Estate",
    prismaModel: "realEstate",
    gridColumns: [
      { key: "identifier", label: "Property Identifier" },
      { key: "currentValue", label: "Current Value" },
    ],
    fields: [
      { name: "identifier", label: "Property Identifier", type: "text", required: true, placeholder: "Enter property name or ID" },
      { name: "propertyType", label: "Type of Property", type: "select", required: false, options: ["Residential", "Commercial", "Land", "Other"] },
      { name: "address", label: "Address", type: "text", required: false, placeholder: "Enter property address" },
      { name: "purchasePrice", label: "Purchase Price", type: "number", required: true, placeholder: "0.00" },
      { name: "currentValue", label: "Current Value", type: "number", required: false, placeholder: "Defaults to purchase price" },
      { name: "mortgageAmount", label: "Mortgage / Loan Amount", type: "number", required: true, defaultValue: 0, placeholder: "Enter 0 if no loan" },
    ],
  },
  pension: {
    key: "pension",
    label: "Pension",
    pluralLabel: "Pensions",
    prismaModel: "pension",
    gridColumns: [
      { key: "providerName", label: "Pension Provider" },
      { key: "currentValue", label: "Current Value" },
    ],
    fields: [
      { name: "holderName", label: "Account Holder Name", type: "text", required: true, placeholder: "Enter account holder name" },
      { name: "providerName", label: "Pension Provider Name", type: "text", required: true, placeholder: "Enter provider name" },
      { name: "schemeName", label: "Pension Scheme Name", type: "text", required: false, placeholder: "Enter scheme name" },
      { name: "address", label: "Address", type: "text", required: false, placeholder: "Enter address" },
      { name: "accountNumber", label: "Account Number", type: "text", required: false, placeholder: "Enter account number" },
      { name: "contactInfo", label: "Email / Phone Number", type: "text", required: false, placeholder: "Enter contact info" },
      { name: "currentValue", label: "Current Value", type: "number", required: true, placeholder: "0.00" },
    ],
  },
  loans: {
    key: "loans",
    label: "Loan",
    pluralLabel: "Loans",
    prismaModel: "loan",
    gridColumns: [
      { key: "institution", label: "Institution Name" },
      { key: "outstandingBalance", label: "Outstanding Balance" },
    ],
    fields: [
      { name: "institution", label: "Institution Name", type: "text", required: true, placeholder: "Enter institution name" },
      { name: "loanType", label: "Type of Loan", type: "select", required: true, options: ["Mortgage", "Retail", "Car", "Credit card", "Other"] },
      { name: "loanAmount", label: "Loan Amount", type: "number", required: true, placeholder: "0.00" },
      { name: "tenureYears", label: "Tenure (Years)", type: "number", required: false, placeholder: "Enter tenure in years" },
      { name: "startDate", label: "Start Date", type: "date", required: false },
      { name: "monthlyPayment", label: "Monthly Payment", type: "number", required: false, placeholder: "0.00" },
      { name: "outstandingBalance", label: "Outstanding Balance", type: "number", required: true, placeholder: "Defaults to loan amount" },
    ],
  },
  insurance: {
    key: "insurance",
    label: "Insurance Policy",
    pluralLabel: "Insurance Policies",
    prismaModel: "insurance",
    gridColumns: [
      { key: "insuredName", label: "Insured Person" },
      { key: "provider", label: "Provider" },
      { key: "sumAssured", label: "Sum Assured" },
    ],
    fields: [
      { name: "insuredName", label: "Name of Insured Person", type: "text", required: true, placeholder: "Enter insured person name" },
      { name: "provider", label: "Insurance Provider", type: "text", required: false, placeholder: "Enter provider name" },
      { name: "policyType", label: "Type of Policy", type: "select", required: false, options: ["Life", "Health", "Home", "Vehicle", "Other"] },
      { name: "policyNumber", label: "Policy Number", type: "text", required: false, placeholder: "Enter policy number" },
      { name: "sumAssured", label: "Sum Assured", type: "number", required: false, placeholder: "0.00" },
      { name: "currentPayoutValue", label: "Current Payout Value", type: "number", required: false, defaultValue: 0, placeholder: "0.00" },
      { name: "documentPath", label: "Policy Document", type: "file", required: false },
    ],
  },
};
