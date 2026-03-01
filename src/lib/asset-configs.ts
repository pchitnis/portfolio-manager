import { CURRENCY_GROUPED_OPTIONS } from "@/lib/currencies";

export type FieldType = "text" | "number" | "date" | "select" | "file";

export interface SelectOption {
  value: string;
  label: string;
}

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
  groupedOptions?: { label: string; options: SelectOption[] }[];
  allowCustom?: boolean;
  defaultValue?: string | number;
  autoCalc?: string;
  readOnly?: boolean;
  showWhen?: { field: string; values: string[] };
  autoFetchPrice?: {
    symbolField: string;
    quantityField: string;
    fallbackPriceField: string;
    apiPath: string;
  };
  autoCalcCompound?: {
    principalField: string;
    rateField: string;
    frequencyField: string;
    startDateField: string;
  };
  autoSuggestNextDue?: {
    frequencyField: string;
    dayField: string;
    monthField: string;
    qMonth1Field: string;
    qMonth2Field: string;
    qMonth3Field: string;
    qMonth4Field: string;
  };
}

export interface GridColumn {
  key: string;
  label: string;
  computed?: (item: Record<string, any>) => any;
  noFormatCurrency?: boolean; // show raw number, not formatted as currency
  noTotal?: boolean; // exclude this column from the Total row
}

export interface AssetTypeConfig {
  key: string;
  label: string;
  pluralLabel: string;
  prismaModel: string;
  gridColumns: GridColumn[];
  fields: FieldConfig[];
}

const currencyField: FieldConfig = {
  name: "currency",
  label: "Currency",
  type: "select",
  required: false,
  defaultValue: "INR",
  groupedOptions: CURRENCY_GROUPED_OPTIONS,
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const PAYMENT_DAYS = Array.from({ length: 28 }, (_, i) => String(i + 1));

export const assetConfigs: Record<string, AssetTypeConfig> = {
  "bank-accounts": {
    key: "bank-accounts",
    label: "Bank Account",
    pluralLabel: "Bank Accounts",
    prismaModel: "bankAccount",
    gridColumns: [
      { key: "holderName", label: "Account Holder" },
      { key: "bankName", label: "Bank Name" },
      { key: "currentBalance", label: "Current Balance" },
    ],
    fields: [
      { name: "holderName", label: "Account Holder Name", type: "text", required: true, placeholder: "Enter account holder name" },
      { name: "bankName", label: "Bank Name", type: "text", required: true, placeholder: "Enter bank name" },
      { name: "accountNumber", label: "Account Number", type: "text", required: false, placeholder: "Enter account number" },
      { name: "sortCode", label: "Sort Code", type: "text", required: false, placeholder: "Enter sort code" },
      currencyField,
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
      currencyField,
      { name: "amount", label: "Amount", type: "number", required: true, defaultValue: 0, placeholder: "0.00" },
      { name: "annualRate", label: "Annual Rate of Return (%)", type: "number", required: false, placeholder: "e.g. 4.5" },
      { name: "interestFrequency", label: "Interest Frequency", type: "select", required: false, options: ["Annually", "Semi-annually", "Quarterly", "Monthly"] },
      { name: "startDate", label: "Start Date", type: "date", required: false },
      { name: "maturityDate", label: "Maturity Date", type: "date", required: false },
      { name: "currentValue", label: "Current Value", type: "number", required: false, placeholder: "Auto-calculated or enter manually",
        autoCalcCompound: { principalField: "amount", rateField: "annualRate", frequencyField: "interestFrequency", startDateField: "startDate" } },
      { name: "maturityValue", label: "Maturity Value", type: "number", required: false, placeholder: "Enter expected maturity value" },
    ],
  },
  stocks: {
    key: "stocks",
    label: "Stock / Mutual Fund",
    pluralLabel: "Stocks & Mutual Funds",
    prismaModel: "stock",
    gridColumns: [
      { key: "name", label: "Stock Name" },
      { key: "currency", label: "Currency", noFormatCurrency: true },
      { key: "buyPrice", label: "Buying Price", noTotal: true },
      { key: "quantity", label: "Quantity", noFormatCurrency: true },
      { key: "currentValue", label: "Current Value" },
    ],
    fields: [
      { name: "name", label: "Stock / Mutual Fund Name", type: "text", required: true, placeholder: "Enter stock or fund name" },
      { name: "symbol", label: "Symbol", type: "text", required: true, placeholder: "e.g. AAPL, MSFT" },
      { name: "purchaseDate", label: "Date of Purchase", type: "date", required: false },
      currencyField,
      { name: "buyPrice", label: "Buy Price", type: "number", required: true, placeholder: "0.00" },
      { name: "quantity", label: "Quantity", type: "number", required: true, placeholder: "0" },
      { name: "currentValue", label: "Current Value", type: "number", required: false, placeholder: "Fetched from Yahoo Finance", readOnly: true,
        autoFetchPrice: { symbolField: "symbol", quantityField: "quantity", fallbackPriceField: "buyPrice", apiPath: "/api/stocks/price" } },
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
      currencyField,
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
      { key: "purchasePrice", label: "Purchase Value" },
      { key: "currentValue", label: "Estimated Current Value" },
      { key: "mortgageAmount", label: "Mortgage / Loan Amount" },
      {
        key: "netAssetValue",
        label: "Net Asset Value",
        computed: (item) => (item.currentValue ?? item.purchasePrice) - (item.mortgageAmount ?? 0),
      },
    ],
    fields: [
      { name: "identifier", label: "Property Identifier", type: "text", required: true, placeholder: "Enter property name or ID" },
      { name: "propertyType", label: "Type of Property", type: "select", required: false, options: ["Residential", "Commercial", "Land", "Other"] },
      { name: "address", label: "Address", type: "text", required: false, placeholder: "Enter property address" },
      currencyField,
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
      currencyField,
      { name: "currentValue", label: "Current Value", type: "number", required: true, placeholder: "0.00" },
    ],
  },
  loans: {
    key: "loans",
    label: "Loan",
    pluralLabel: "Loans",
    prismaModel: "loan",
    gridColumns: [
      { key: "holderName", label: "Account Holder" },
      { key: "institution", label: "Institution Name" },
      { key: "loanType", label: "Type of Loan", noFormatCurrency: true },
      { key: "loanAmount", label: "Loan Amount" },
      { key: "outstandingBalance", label: "Outstanding Balance" },
      { key: "monthlyPayment", label: "Monthly Payment" },
    ],
    fields: [
      { name: "holderName", label: "Account Holder Name", type: "text", required: false, placeholder: "Enter account holder name" },
      { name: "institution", label: "Institution Name", type: "text", required: true, placeholder: "Enter institution name" },
      { name: "loanType", label: "Type of Loan", type: "select", required: true, options: ["Mortgage", "Car", "Credit card", "Retail", "Other"] },
      currencyField,
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
      { key: "policyType", label: "Type of Policy", noFormatCurrency: true },
      { key: "provider", label: "Provider" },
      { key: "sumAssured", label: "Sum Assured" },
      { key: "premiumAmount", label: "Premium Amount" },
      { key: "nextDueDate", label: "Next Due Date", noFormatCurrency: true },
    ],
    fields: [
      { name: "insuredName", label: "Name of Insured Person", type: "text", required: true, placeholder: "Enter insured person name" },
      { name: "provider", label: "Insurance Provider", type: "text", required: false, placeholder: "Enter provider name" },
      { name: "policyType", label: "Type of Policy", type: "select", required: false, options: ["Life", "Health", "Home", "Vehicle", "Other"] },
      { name: "policyNumber", label: "Policy Number", type: "text", required: false, placeholder: "Enter policy number" },
      currencyField,
      { name: "sumAssured", label: "Sum Assured", type: "number", required: false, placeholder: "0.00" },
      { name: "currentPayoutValue", label: "Current Payout Value", type: "number", required: false, defaultValue: 0, placeholder: "0.00" },
      { name: "premiumAmount", label: "Premium Amount", type: "number", required: false, placeholder: "0.00" },
      { name: "paymentFrequency", label: "Payment Frequency", type: "select", required: false, options: ["Monthly", "Quarterly", "Annually"] },
      // Payment day — shown whenever frequency is selected
      { name: "paymentDay", label: "Payment Day", type: "select", required: false, options: PAYMENT_DAYS,
        showWhen: { field: "paymentFrequency", values: ["Monthly", "Quarterly", "Annually"] } },
      // Payment month — only for Annually
      { name: "paymentMonth", label: "Payment Month", type: "select", required: false, options: MONTHS,
        showWhen: { field: "paymentFrequency", values: ["Annually"] } },
      // Quarter months — only for Quarterly (each restricted to its calendar quarter)
      { name: "paymentQMonth1", label: "Quarter 1 Month", type: "select", required: false,
        options: ["January", "February", "March"],
        showWhen: { field: "paymentFrequency", values: ["Quarterly"] } },
      { name: "paymentQMonth2", label: "Quarter 2 Month", type: "select", required: false,
        options: ["April", "May", "June"],
        showWhen: { field: "paymentFrequency", values: ["Quarterly"] } },
      { name: "paymentQMonth3", label: "Quarter 3 Month", type: "select", required: false,
        options: ["July", "August", "September"],
        showWhen: { field: "paymentFrequency", values: ["Quarterly"] } },
      { name: "paymentQMonth4", label: "Quarter 4 Month", type: "select", required: false,
        options: ["October", "November", "December"],
        showWhen: { field: "paymentFrequency", values: ["Quarterly"] } },
      // Next due date — auto-suggested from schedule
      { name: "nextDueDate", label: "Next Premium Due Date", type: "date", required: false,
        autoSuggestNextDue: {
          frequencyField: "paymentFrequency", dayField: "paymentDay", monthField: "paymentMonth",
          qMonth1Field: "paymentQMonth1", qMonth2Field: "paymentQMonth2",
          qMonth3Field: "paymentQMonth3", qMonth4Field: "paymentQMonth4",
        } },
      { name: "documentPath", label: "Policy Document", type: "file", required: false },
    ],
  },
};
