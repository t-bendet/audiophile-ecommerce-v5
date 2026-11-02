import type { OrderDTO } from "@repo/domain";
import { describe, expect, it } from "vitest";
import { orderConfirmationEmail } from "../src/emails/order-confirmation.js";

const order: OrderDTO = {
  id: "507f1f77bcf86cd799439011",
  userId: "507f1f77bcf86cd799439012",
  items: [
    {
      id: "507f1f77bcf86cd799439013",
      productId: "507f1f77bcf86cd799439014",
      productName: "XX99 MK II",
      productSlug: "xx99-mark-two-headphones",
      productImage: {
        src: "https://audiophile-media.t-bendet.com/xx99.jpg",
        width: 150,
        height: 150,
      },
      quantity: 2,
      price: 2999,
      subtotal: 5998,
    },
  ],
  status: "PENDING",
  subtotal: 5998,
  shippingCost: 50,
  tax: 1200,
  total: 7248,
  shippingAddress: {
    fullName: 'Ada <"Countess"> & Co',
    email: "ada@example.com",
    phone: "555-0100",
    address: "1 Analytical Way",
    city: "London",
    state: "London",
    zipCode: "E1 6AN",
    country: "UK",
  },
  billingAddress: {
    fullName: "Ada Lovelace",
    address: "1 Analytical Way",
    city: "London",
    state: "London",
    zipCode: "E1 6AN",
    country: "UK",
  },
  paymentMethod: "<script>alert(1)</script>",
  paymentStatus: "PENDING",
  createdAt: new Date("2026-11-02T10:00:00Z"),
  updatedAt: new Date("2026-11-02T10:00:00Z"),
};

describe("orderConfirmationEmail", () => {
  it("lists each item with its quantity and the four totals in both parts", () => {
    const { text, html } = orderConfirmationEmail(order);

    expect(text).toContain("- XX99 MK II x 2: $ 5,998");
    expect(html).toContain("XX99 MK II &times; 2");
    for (const line of ["Subtotal", "Shipping", "Tax", "Total"]) {
      expect(text).toContain(`${line}: `);
    }
    expect(text).toContain("Total: $ 7,248");
    expect(html).toContain("$ 7,248");
  });

  it("escapes what the shopper typed in the HTML part", () => {
    const { html } = orderConfirmationEmail(order);

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("Ada &lt;&quot;Countess&quot;&gt; &amp; Co");
  });
});
