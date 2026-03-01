import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}

export interface DashboardData {
  netAssetValue: number;
  totalAssets: number;
  totalLiabilities: number;
  quickLiquidAssets: number;
  lifeInsuranceCover: number;
  lifeInsuranceByPerson: Record<string, number>;
  loansByType: Record<string, number>;
  breakdown: {
    bankAccounts: number;
    termDeposits: number;
    stocks: number;
    metals: number;
    realEstate: number;
    pension: number;
    loans: number;
    insuranceValue: number;
  };
}
