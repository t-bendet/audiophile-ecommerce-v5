import { NAME } from "@repo/domain";

export const paths = {
  home: {
    path: "/",
    getHref: () => "/",
  },
  category: {
    path: "category/:categoryName",
    getHref: (categoryName: NAME) => `/category/${categoryName}`,
  },
  product: {
    path: "product/:productSlug",
    getHref: (slug: string) => `/product/${slug}`,
  },
  checkout: {
    cart: {},
    checkout: {},
    payment: {},
    orderConfirmation: {},
    orderSummary: {},
    orderDetails: {},
  },
  auth: {
    register: {
      path: "/auth/register",
      getHref: (redirectTo?: string | null | undefined) =>
        `/auth/register${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`,
    },
    login: {
      path: "/auth/login",
      getHref: (redirectTo?: string | null | undefined) =>
        `/auth/login${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`,
    },
  },
  account: {
    root: {},
    orders: {},
    addresses: {},
    paymentMethods: {},
    settings: {},
    wishlist: {},
    reviews: {},
    loginAndSecurity: {
      resetPassword: {},
      verifyEmail: {},
      verifyPhone: {},
      logout: {},
      refreshToken: {},
      forgotPassword: {},
    },
  },
  admin: {
    root: {},
    users: {},
    products: {},
    orders: {},
    categories: {},
    settings: {},
    reports: {},
    analytics: {},
  },
} as const;
