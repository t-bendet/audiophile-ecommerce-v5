/** Whole US dollars with a space after the sign: `$ 1,250`. */
export function formatPrice(price: number): string {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });
  return formatter
    .formatToParts(price)
    .map((part) => {
      if (part.type === "currency") return `${part.value} `;
      if (part.type === "fraction" || part.type === "decimal") return "";
      return part.value;
    })
    .join("");
}

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
