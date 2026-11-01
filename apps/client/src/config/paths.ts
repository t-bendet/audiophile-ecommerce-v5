import { NAME } from "@repo/domain";

export type LoginReason = "deactivated";

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
    checkout: {
      path: "/checkout",
      getHref: () => "/checkout",
    },
  },
  auth: {
    signup: {
      path: "/auth/signup",
      getHref: (redirectTo?: string | null | undefined) =>
        `/auth/signup${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`,
    },
    login: {
      path: "/auth/login",
      /** `reason` names why a signed-in session was sent here; the form explains it. */
      getHref: (
        redirectTo?: string | null | undefined,
        reason?: LoginReason,
      ) => {
        const params = new URLSearchParams();
        if (redirectTo) params.set("redirectTo", redirectTo);
        if (reason) params.set("reason", reason);
        const search = params.toString();
        return `/auth/login${search ? `?${search}` : ""}`;
      },
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
    security: {
      path: "/account/security",
      getHref: () => "/account/security",
      resetPassword: {},
      verifyEmail: {},
      verifyPhone: {},
      logout: {},
      refreshToken: {},
      forgotPassword: {},
    },
    orders: {
      path: "/account/orders",
      getHref: () => "/account/orders",
    },
    // addresses: {},
    // paymentMethods: {},
    // settings: {},
    // wishlist: {},
    // reviews: {},
  },
  admin: {
    root: {
      path: "/admin",
      getHref: () => "/admin",
    },
    orders: {
      path: "/admin/orders",
      getHref: () => "/admin/orders",
    },
    order: {
      path: "/admin/orders/:orderId",
      getHref: (orderId: string) => `/admin/orders/${orderId}`,
    },
    users: {
      path: "/admin/users",
      getHref: () => "/admin/users",
    },
    user: {
      path: "/admin/users/:userId",
      getHref: (userId: string) => `/admin/users/${userId}`,
    },
    products: {
      path: "/admin/products",
      getHref: () => "/admin/products",
    },
    product: {
      path: "/admin/products/:productId",
      getHref: (productId: string) => `/admin/products/${productId}`,
    },
    homepage: {
      path: "/admin/homepage",
      getHref: () => "/admin/homepage",
    },
  },
} as const;

type TAccountPaths = keyof (typeof paths)["account"];

export type TAccountPathKeys = {
  [K in TAccountPaths]: K extends "root" ? never : K;
}[TAccountPaths];
