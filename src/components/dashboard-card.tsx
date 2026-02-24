import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";

interface DashboardCardProps {
  title: string;
  amount: number;
  currency?: string;
  variant?: "default" | "positive" | "negative" | "info";
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  children?: React.ReactNode;
}

export function DashboardCard({
  title,
  amount,
  currency = "USD",
  variant = "default",
  expandable,
  expanded,
  onToggle,
  children,
}: DashboardCardProps) {
  const colorMap = {
    default: "border-l-4 border-l-blue-500",
    positive: "border-l-4 border-l-green-500",
    negative: "border-l-4 border-l-red-500",
    info: "border-l-4 border-l-purple-500",
  };

  return (
    <Card className={colorMap[variant]}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(amount, currency)}</p>
          </div>
          {expandable && (
            <Button variant="ghost" size="sm" onClick={onToggle}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Show Details
            </Button>
          )}
        </div>
        {expanded && children && <div className="mt-4">{children}</div>}
      </CardContent>
    </Card>
  );
}
