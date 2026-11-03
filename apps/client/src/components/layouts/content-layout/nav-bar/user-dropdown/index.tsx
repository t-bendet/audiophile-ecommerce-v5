import { getAuthStatusQueryOptions } from "@/lib/auth";
import { useSuspenseQuery } from "@tanstack/react-query";
import { MenuFallback } from "@/components/prototype/storefront-loading/menu-fallback";
import { useProto } from "@/components/prototype/storefront-loading/store";
import AnonymousUserDropdown from "./anonymous-user-dropdown";
import LoggedInUserDropdown from "./logged-in-user-dropdown";

export function UserDropdown() {
  const { data: authData } = useSuspenseQuery(getAuthStatusQueryOptions());
  // PROTOTYPE (#359): hold the menu in its loading state to judge the fallback.
  const { holdMenu } = useProto();
  if (holdMenu) return <MenuFallback />;

  return authData.isAuthenticated ? (
    <LoggedInUserDropdown />
  ) : (
    <AnonymousUserDropdown />
  );
}
