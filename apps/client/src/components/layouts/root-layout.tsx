import { Outlet, ScrollRestoration } from "react-router";

export function RootLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <ScrollRestoration />
      <Outlet />
    </div>
  );
}
