export function extractNumber(value, fallback = 0) {
  const num = parseFloat(value);
  return isNaN(num) ? fallback : num;
}

export function safeNum(value, fallback = 0) {
  if (value == null || isNaN(value)) return fallback;
  return value;
}

export function formatINR(value) {
  if (value == null || isNaN(value)) return '₹0';
  return '₹' + Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatPct(value) {
  if (value == null || isNaN(value)) return '0.00%';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}
