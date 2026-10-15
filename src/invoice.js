export function calculateInvoice(items, taxMode, enableWithholding) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  // 消費税は明細全体で一度だけ計算し、1円未満を切り捨てる。
  const taxAmount = taxMode === 'inclusive'
    ? Math.floor(subtotal / 11)
    : Math.floor(subtotal / 10);
  const subtotalExcludingTax = taxMode === 'inclusive' ? subtotal - taxAmount : subtotal;
  // 源泉徴収は税抜金額の10.21%（100万円以下を想定した簡易計算）。
  const withholdingAmount = enableWithholding ? Math.floor(subtotalExcludingTax * 1021 / 10000) : 0;
  const totalAmount = subtotalExcludingTax + taxAmount - withholdingAmount;

  return { subtotal, taxAmount, withholdingAmount, totalAmount };
}
