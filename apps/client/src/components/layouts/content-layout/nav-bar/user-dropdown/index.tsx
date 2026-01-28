import { getAuthStatusQueryOptions } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import LoggedInUserDropdown from "./logged-in-user-dropdown";
import AnonymousUserDropdown from "./anonymous-user-dropdown";

export function UserDropdown() {
  const { data, isLoading, isError } = useQuery(getAuthStatusQueryOptions());
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (isError) {
    return <div>Error loading user data</div>;
  }
  if (!data) {
    return <div className="bg-black">No user data available</div>;
  }

  return data.isAuthenticated ? (
    <LoggedInUserDropdown />
  ) : (
    <AnonymousUserDropdown />
  );
}
