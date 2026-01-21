import { getUserQueryOptions } from "@/lib/auth";
import { normalizeError } from "@/lib/errors/errors";
import { QueryClient } from "@tanstack/react-query";
import { LoaderFunctionArgs, Outlet } from "react-router";

export default function UserAreaLayout() {
  return (
    <main className="flex min-h-dvh flex-col">
      <Outlet />
    </main>
  );
}

export const clientLoader =
  (queryClient: QueryClient) => async (context: LoaderFunctionArgs) => {
    console.log({ context });
    console.log("User Area Loader Running");
    // TODO find a better approach then just calling  getUser to check auth status,will do for now
    try {
      await queryClient.ensureQueryData(getUserQueryOptions());
    } catch (error) {
      const normalizedError = normalizeError(error);
      if (normalizedError.code === "UNAUTHORIZED") {
        // silently fail, user is not logged in
      } else {
        throw normalizedError;
      }
    }
    return null;
  };
