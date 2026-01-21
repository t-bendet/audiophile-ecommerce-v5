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
    signup: {
      path: "/auth/signup",
      getHref: (redirectTo?: string | null | undefined) =>
        `/auth/signup${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`,
    },
    login: {
      path: "/auth/login",
      getHref: (redirectTo?: string | null | undefined) =>
        `/auth/login${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`,
    },
  },
  account: {
    root: {
      path: "/account",
      getHref: () => "/account",
    },
    profile: {
      path: "/account/profile",
      getHref: () => "/account/profile",
    },
    loginAndSecurity: {
      resetPassword: {},
      verifyEmail: {},
      verifyPhone: {},
      logout: {},
      refreshToken: {},
      forgotPassword: {},
    },
    orders: {},
    addresses: {},
    paymentMethods: {},
    settings: {},
    wishlist: {},
    reviews: {},
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
