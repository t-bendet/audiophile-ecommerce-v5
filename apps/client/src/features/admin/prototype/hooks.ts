// PROTOTYPE view logic shared by the variants so each one differs in layout, not behaviour.
import { useState } from "react";
import { toast } from "sonner";
import {
  homepage,
  ORDER_TRANSITIONS,
  PAYMENT_TRANSITIONS,
  products,
  type Order,
  type OrderStatus,
  type PaymentStatus,
  type Product,
} from "./data";

export function useOrderEdit(order: Order) {
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [payment, setPayment] = useState<PaymentStatus>(order.paymentStatus);
  const statusOptions = [order.status, ...ORDER_TRANSITIONS[order.status]];
  const paymentOptions = [
    order.paymentStatus,
    ...PAYMENT_TRANSITIONS[order.paymentStatus],
  ];
  const refundDue = status === "CANCELLED" && order.paymentStatus === "PAID";
  const dirty = status !== order.status || payment !== order.paymentStatus;
  const save = () =>
    toast.success("Order updated", {
      description: `${status.toLowerCase()} · ${payment.toLowerCase()} (prototype: nothing persisted)`,
    });
  return {
    status,
    setStatus,
    statusOptions,
    payment,
    setPayment,
    paymentOptions,
    refundDue,
    dirty,
    save,
  };
}

export function useProductEdit(product: Product) {
  const [draft, setDraft] = useState(product);
  const update = <K extends keyof Product>(key: K, value: Product[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const updateItem = (
    index: number,
    patch: Partial<Product["includedItems"][number]>,
  ) =>
    setDraft((d) => ({
      ...d,
      includedItems: d.includedItems.map((row, i) =>
        i === index ? { ...row, ...patch } : row,
      ),
    }));
  const addItem = () =>
    setDraft((d) => ({
      ...d,
      includedItems: [...d.includedItems, { item: "", quantity: 1 }],
    }));
  const removeItem = (index: number) =>
    setDraft((d) => ({
      ...d,
      includedItems: d.includedItems.filter((_, i) => i !== index),
    }));
  const save = () =>
    toast.success("Product saved", {
      description: `${draft.name} (prototype: nothing persisted)`,
    });
  return { draft, update, updateItem, addItem, removeItem, save };
}

export type Slot = {
  key: string;
  label: string;
  productId: string;
  options: Product[];
  set: (id: string) => void;
};

export function useHomepageSlots() {
  const [featured, setFeatured] = useState(homepage.featuredProductId);
  const [showcase, setShowcase] = useState(homepage.showcaseProductIds);
  const chosen = [featured, ...showcase];
  const slots: Slot[] = [
    {
      key: "featured",
      label: "Featured product",
      productId: featured,
      options: products.filter((p) => p.hasFeaturedImage),
      set: setFeatured,
    },
    ...showcase.map((id, i) => ({
      key: `showcase-${i + 1}`,
      label: `Showcase ${i + 1}`,
      productId: id,
      options: products.filter((p) => p.hasShowcaseImage),
      set: (next: string) =>
        setShowcase(
          (s) => s.map((v, j) => (j === i ? next : v)) as typeof showcase,
        ),
    })),
  ];
  const isTaken = (slotKey: string, productId: string) =>
    slots.some((s) => s.key !== slotKey && s.productId === productId) &&
    chosen.includes(productId);
  const save = () =>
    toast.success("Homepage updated", {
      description: "prototype: nothing persisted",
    });
  return { slots, isTaken, save };
}

export function useConfirm() {
  const [open, setOpen] = useState(false);
  return { open, setOpen };
}
