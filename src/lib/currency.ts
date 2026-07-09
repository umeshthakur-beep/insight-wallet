export function formatINR(n: number): string {
  if (!Number.isFinite(n)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatINRSigned(n: number): string {
  const s = formatINR(Math.abs(n));
  return n < 0 ? `-${s}` : n > 0 ? `+${s}` : s;
}
