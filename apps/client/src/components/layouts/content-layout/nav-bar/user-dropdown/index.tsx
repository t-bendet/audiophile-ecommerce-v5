import { getAuthStatusQueryOptions } from "@/lib/auth";
import { useSuspenseQuery } from "@tanstack/react-query";
import AnonymousUserDropdown from "./anonymous-user-dropdown";
import LoggedInUserDropdown from "./logged-in-user-dropdown";

export function UserDropdown() {
  const { data: authData } = useSuspenseQuery(getAuthStatusQueryOptions());

  return authData.isAuthenticated ? (
    <LoggedInUserDropdown />
  ) : (
    <AnonymousUserDropdown />
  );
}
