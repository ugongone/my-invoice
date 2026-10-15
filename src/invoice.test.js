import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateInvoice } from './invoice.js';

test('税抜10万円に消費税を加算する', () => {
  assert.deepEqual(calculateInvoice([{ price: 100000, quantity: 1 }], 'exclusive', false), {
    subtotal: 100000, taxAmount: 10000, withholdingAmount: 0, totalAmount: 110000,
  });
});

test('税込11万円の内税を計算し、入力金額を合計に保つ', () => {
  assert.deepEqual(calculateInvoice([{ price: 110000, quantity: 1 }], 'inclusive', false), {
    subtotal: 110000, taxAmount: 10000, withholdingAmount: 0, totalAmount: 110000,
  });
});

test('どちらの税区分でも税抜金額から源泉徴収を計算する', () => {
  for (const [taxMode, price] of [['exclusive', 100000], ['inclusive', 110000]]) {
    const result = calculateInvoice([{ price, quantity: 1 }], taxMode, true);
    assert.equal(result.withholdingAmount, 10210);
    assert.equal(result.totalAmount, 99790);
  }
});

test('複数明細の税額は合計してから一度だけ切り捨てる', () => {
  const items = [{ price: 55, quantity: 2 }, { price: 59, quantity: 1 }];
  assert.equal(calculateInvoice(items, 'exclusive', false).taxAmount, 16);
  const inclusive = calculateInvoice(items, 'inclusive', false);
  assert.equal(inclusive.taxAmount, 15);
  assert.equal(inclusive.totalAmount, 169);
});

test('空の明細はどちらの税区分でも0円になる', () => {
  for (const taxMode of ['exclusive', 'inclusive']) {
    assert.deepEqual(calculateInvoice([], taxMode, true), {
      subtotal: 0, taxAmount: 0, withholdingAmount: 0, totalAmount: 0,
    });
  }
});
