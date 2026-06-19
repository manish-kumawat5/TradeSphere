export function formatPrice(value) {
  if (value == null || isNaN(value)) return '0.00';
  return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatCurrency(value) {
  if (value == null || isNaN(value)) return '₹0.00';
  return '₹' + value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatPercent(value) {
  if (value == null || isNaN(value)) return '0.00';
  return value.toFixed(2);
}
