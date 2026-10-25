/**
 * Format a whole-cedis amount as Ghana cedi currency, e.g. GH₵1,500.
 */
export function formatGHS(price: number): string {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 0,
  }).format(price);
}

/** Short suffix shown after a price, e.g. "/month". */
export function pricePeriodSuffix(period: string): string {
  switch (period) {
    case "MONTH":
      return "/month";
    case "YEAR":
      return "/year";
    default:
      return "";
  }
}
