// PROTOTYPE fixtures for the admin dashboard design pass (#320). In-memory only.

export type OrderStatus =
  "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];
export const PAYMENT_STATUSES: PaymentStatus[] = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
];

// Transition tables as specced in #323.
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
  DELIVERED: ["CANCELLED"],
  CANCELLED: [],
};
export const PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  PENDING: ["PAID", "FAILED"],
  FAILED: ["PAID"],
  PAID: ["REFUNDED"],
  REFUNDED: [],
};

export type Category = "Headphones" | "Earphones" | "Speakers";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: Category;
  price: number;
  isNewProduct: boolean;
  description: string;
  featuresText: string;
  includedItems: { item: string; quantity: number }[];
  cartLabel: string;
  shortLabel: string;
  fullLabel: string;
  hasFeaturedImage: boolean;
  hasShowcaseImage: boolean;
};

export type Address = {
  fullName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
};

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

export type Order = {
  id: string;
  createdAt: Date;
  customer: { id: string; name: string; email: string };
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  vat: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: "e-Money" | "Cash on Delivery";
  shippingAddress: Address;
  billingAddress: Address;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  active: boolean;
  createdAt: Date;
};

const MEDIA = "https://audiophile-media.t-bendet.com/products";
export const thumbnailUrl = (slug: string) => `${MEDIA}/${slug}/thumbnail.jpg`;
export const featuredUrl = (slug: string) =>
  `${MEDIA}/${slug}/featured-mobile.jpg`;
export const showcaseUrl = (slug: string) =>
  `${MEDIA}/${slug}/showcase-mobile.jpg`;

export const products: Product[] = [
  {
    id: "p1",
    slug: "xx59-headphones",
    name: "XX59 Headphones",
    category: "Headphones",
    price: 899,
    isNewProduct: false,
    description:
      "Enjoy your audio almost anywhere and customize it to your specific tastes with the XX59 headphones.",
    featuresText:
      "These headphones have been created from durable, high-quality materials tough enough to take anywhere.",
    includedItems: [
      { item: "Headphone unit", quantity: 1 },
      { item: "Replacement earcups", quantity: 2 },
      { item: "User manual", quantity: 1 },
      { item: "3.5mm 5m audio cable", quantity: 1 },
    ],
    cartLabel: "XX59",
    shortLabel: "XX59",
    fullLabel: "XX59 Headphones",
    hasFeaturedImage: false,
    hasShowcaseImage: false,
  },
  {
    id: "p2",
    slug: "xx99-mark-one-headphones",
    name: "XX99 Mark I Headphones",
    category: "Headphones",
    price: 1750,
    isNewProduct: false,
    description:
      "As the gold standard for headphones, the classic XX99 Mark I offers detailed and accurate audio reproduction.",
    featuresText:
      "As the headphones all others are measured against, the XX99 Mark I demonstrates over five decades of audio expertise.",
    includedItems: [
      { item: "Headphone unit", quantity: 1 },
      { item: "Replacement earcups", quantity: 2 },
      { item: "User manual", quantity: 1 },
      { item: "3.5mm 5m audio cable", quantity: 1 },
    ],
    cartLabel: "XX99 MK I",
    shortLabel: "XX99 MK I",
    fullLabel: "XX99 Mark I Headphones",
    hasFeaturedImage: false,
    hasShowcaseImage: false,
  },
  {
    id: "p3",
    slug: "xx99-mark-two-headphones",
    name: "XX99 Mark II Headphones",
    category: "Headphones",
    price: 2999,
    isNewProduct: true,
    description:
      "The new XX99 Mark II headphones is the pinnacle of pristine audio. It redefines your premium headphone experience.",
    featuresText:
      "Featuring a genuine leather head strap and premium earcups, these headphones deliver superior comfort.",
    includedItems: [
      { item: "Headphone unit", quantity: 1 },
      { item: "Replacement earcups", quantity: 2 },
      { item: "User manual", quantity: 1 },
      { item: "3.5mm 5m audio cable", quantity: 1 },
      { item: "Travel bag", quantity: 1 },
    ],
    cartLabel: "XX99 MK II",
    shortLabel: "XX99 MK II",
    fullLabel: "XX99 Mark II Headphones",
    hasFeaturedImage: true,
    hasShowcaseImage: false,
  },
  {
    id: "p4",
    slug: "yx1-wireless-earphones",
    name: "YX1 Wireless Earphones",
    category: "Earphones",
    price: 599,
    isNewProduct: true,
    description:
      "Tailor your listening experience with bespoke dynamic drivers from the new YX1 Wireless Earphones.",
    featuresText:
      "Experience unrivalled stereo sound thanks to innovative acoustic technology.",
    includedItems: [
      { item: "Earphone unit", quantity: 2 },
      { item: "Multi-size earplugs", quantity: 6 },
      { item: "User manual", quantity: 1 },
      { item: "USB-C charging cable", quantity: 1 },
      { item: "Travel pouch", quantity: 1 },
    ],
    cartLabel: "YX1",
    shortLabel: "YX1 Earphones",
    fullLabel: "YX1 Wireless Earphones",
    hasFeaturedImage: false,
    hasShowcaseImage: true,
  },
  {
    id: "p5",
    slug: "zx7-speaker",
    name: "ZX7 Speaker",
    category: "Speakers",
    price: 3500,
    isNewProduct: false,
    description:
      "Stream high quality sound wirelessly with minimal loss. The ZX7 bookshelf speaker uses high-end audiophile components.",
    featuresText:
      "Reap the advantages of a flat diaphragm tweeter cone. This provides a fast response rate and excellent high frequencies.",
    includedItems: [
      { item: "Speaker unit", quantity: 2 },
      { item: "Speaker cloth panel", quantity: 2 },
      { item: "User manual", quantity: 1 },
      { item: "3.5mm 7.5m audio cable", quantity: 1 },
      { item: "7.5m optical cable", quantity: 1 },
    ],
    cartLabel: "ZX7",
    shortLabel: "ZX7 Speaker",
    fullLabel: "ZX7 Speaker",
    hasFeaturedImage: false,
    hasShowcaseImage: true,
  },
  {
    id: "p6",
    slug: "zx9-speaker",
    name: "ZX9 Speaker",
    category: "Speakers",
    price: 4500,
    isNewProduct: true,
    description:
      "Upgrade your sound system with the all new ZX9 active speaker. A bookshelf speaker system that offers truly wireless connectivity.",
    featuresText:
      "Connect via Bluetooth or nearly any wired source. This speaker features optical, digital coaxial, USB Type-B, and stereo RCA inputs.",
    includedItems: [
      { item: "Speaker unit", quantity: 2 },
      { item: "Speaker cloth panel", quantity: 2 },
      { item: "User manual", quantity: 1 },
      { item: "3.5mm 10m audio cable", quantity: 1 },
      { item: "10m optical cable", quantity: 1 },
    ],
    cartLabel: "ZX9",
    shortLabel: "ZX9 Speaker",
    fullLabel: "ZX9 Speaker",
    hasFeaturedImage: false,
    hasShowcaseImage: true,
  },
];

export const productById = (id: string) =>
  products.find((p) => p.id === id) ?? products[0];

const daysAgo = (n: number, hour = 10) => {
  const d = new Date(2026, 10, 1, hour, 24);
  d.setDate(d.getDate() - n);
  return d;
};

export const users: User[] = [
  {
    id: "u1",
    name: "admin",
    email: "admin@example.com",
    role: "ADMIN",
    active: true,
    createdAt: daysAgo(400),
  },
  {
    id: "u2",
    name: "john doe",
    email: "john.doe@example.com",
    role: "USER",
    active: true,
    createdAt: daysAgo(120),
  },
  {
    id: "u3",
    name: "maya levi",
    email: "maya.levi@gmail.com",
    role: "USER",
    active: true,
    createdAt: daysAgo(64),
  },
  {
    id: "u4",
    name: "omar haddad",
    email: "omar.h@outlook.com",
    role: "USER",
    active: false,
    createdAt: daysAgo(58),
  },
  {
    id: "u5",
    name: "sofia rossi",
    email: "sofia.rossi@proton.me",
    role: "USER",
    active: true,
    createdAt: daysAgo(21),
  },
  {
    id: "u6",
    name: "liam chen",
    email: "liam.chen@icloud.com",
    role: "USER",
    active: true,
    createdAt: daysAgo(9),
  },
  {
    id: "u7",
    name: "noa katz",
    email: "noa.katz@example.com",
    role: "USER",
    active: true,
    createdAt: daysAgo(4),
  },
  {
    id: "u8",
    name: "admin2",
    email: "admin2@example.com",
    role: "ADMIN",
    active: true,
    createdAt: daysAgo(390),
  },
];

const address = (name: string, city: string): Address => ({
  fullName: name,
  address: "1137 Williams Avenue",
  city,
  state: "NY",
  zipCode: "10001",
  country: "United States",
});

const makeOrder = (
  n: number,
  userId: string,
  ago: number,
  status: OrderStatus,
  paymentStatus: PaymentStatus,
  lines: [string, number][],
  paymentMethod: Order["paymentMethod"] = "e-Money",
): Order => {
  const user = users.find((u) => u.id === userId)!;
  const items = lines.map(([productId, quantity]) => {
    const p = productById(productId);
    return { productId, name: p.cartLabel, price: p.price, quantity };
  });
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = 50;
  const vat = Math.round(subtotal * 0.2);
  return {
    id: `6724a1c${n.toString(16).padStart(2, "0")}f3b9e2d7c1a04${(n * 7)
      .toString(16)
      .padStart(3, "0")}`,
    createdAt: daysAgo(ago, 8 + (n % 9)),
    customer: { id: user.id, name: user.name, email: user.email },
    items,
    subtotal,
    shipping,
    vat,
    total: subtotal + shipping + vat,
    status,
    paymentStatus,
    paymentMethod,
    shippingAddress: address(user.name, "New York"),
    billingAddress: address(user.name, "New York"),
  };
};

export const orders: Order[] = [
  makeOrder(1, "u7", 0, "PENDING", "PENDING", [["p3", 1]]),
  makeOrder(2, "u6", 1, "PENDING", "PAID", [["p4", 2]]),
  makeOrder(3, "u3", 2, "PROCESSING", "PAID", [
    ["p6", 1],
    ["p4", 1],
  ]),
  makeOrder(
    4,
    "u5",
    3,
    "PROCESSING",
    "FAILED",
    [["p1", 1]],
    "Cash on Delivery",
  ),
  makeOrder(5, "u2", 5, "SHIPPED", "PAID", [["p5", 1]]),
  makeOrder(6, "u3", 8, "SHIPPED", "PAID", [["p2", 1]]),
  makeOrder(7, "u6", 12, "DELIVERED", "PAID", [
    ["p3", 1],
    ["p1", 1],
  ]),
  makeOrder(8, "u4", 15, "CANCELLED", "REFUNDED", [["p6", 2]]),
  makeOrder(9, "u2", 19, "DELIVERED", "PAID", [["p4", 1]]),
  makeOrder(10, "u5", 26, "DELIVERED", "PAID", [["p5", 1]], "Cash on Delivery"),
  makeOrder(11, "u3", 41, "CANCELLED", "FAILED", [["p2", 1]]),
  makeOrder(12, "u2", 77, "DELIVERED", "PAID", [["p6", 1]]),
];

export const orderById = (id: string) =>
  orders.find((o) => o.id === id) ?? orders[0];

export const homepage = {
  featuredProductId: "p3",
  showcaseProductIds: ["p6", "p5", "p4"] as [string, string, string],
};

export type Period = "7d" | "30d" | "90d" | "all";
export const PERIODS: { value: Period; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "all", label: "All time" },
];

export type Stats = {
  ordersCount: number;
  revenue: number;
  newUsers: number;
  ordersByStatus: Record<OrderStatus, number>;
  topProducts: { productId: string; quantity: number }[];
};

const periodDays: Record<Period, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  all: 100000,
};

export const statsFor = (period: Period): Stats => {
  const cutoff = daysAgo(periodDays[period]);
  const inPeriod = orders.filter((o) => o.createdAt >= cutoff);
  const ordersByStatus = Object.fromEntries(
    ORDER_STATUSES.map((s) => [
      s,
      inPeriod.filter((o) => o.status === s).length,
    ]),
  ) as Record<OrderStatus, number>;
  const quantities = new Map<string, number>();
  inPeriod.forEach((o) =>
    o.items.forEach((i) =>
      quantities.set(
        i.productId,
        (quantities.get(i.productId) ?? 0) + i.quantity,
      ),
    ),
  );
  return {
    ordersCount: inPeriod.length,
    revenue: inPeriod
      .filter((o) => o.paymentStatus === "PAID")
      .reduce((s, o) => s + o.total, 0),
    newUsers: users.filter((u) => u.createdAt >= cutoff).length,
    ordersByStatus,
    topProducts: [...quantities.entries()]
      .map(([productId, quantity]) => ({ productId, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5),
  };
};

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });
const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});
export const formatDate = (d: Date) => dateFormatter.format(d);
export const formatDateTime = (d: Date) => dateTimeFormatter.format(d);
export const statusLabel = (value: string) =>
  value.charAt(0) + value.slice(1).toLowerCase();
export const shortId = (id: string) => `…${id.slice(-6)}`;
