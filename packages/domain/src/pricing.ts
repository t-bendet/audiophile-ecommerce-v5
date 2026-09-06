export const SHIPPING_COST = 50;
export const TAX_RATE = 0.2;

export type OrderTotals = {
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
};

export function calculateOrderTotals(subtotal: number): OrderTotals {
  const tax = Math.round(subtotal * TAX_RATE);

  return {
    subtotal,
    shippingCost: SHIPPING_COST,
    tax,
    total: subtotal + SHIPPING_COST + tax,
  };
}
