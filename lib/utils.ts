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

/** Where each role lands after login. */
export function roleHomePath(role: string): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "AGENT":
      return "/dashboard";
    default:
      return "/";
  }
}

/** Human-readable role name. */
export function roleLabel(role: string): string {
  switch (role) {
    case "ADMIN":
      return "Admin";
    case "AGENT":
      return "Agent / Landlord";
    default:
      return "Tenant";
  }
}
