import { Footer } from "@/components/layouts/content-layout/footer";
import { Navbar } from "@/components/layouts/content-layout/nav-bar";
import { getCategoriesQueryOptions } from "@/features/categories/api/get-categories";
import { getUserQueryOptions } from "@/lib/auth";
import { normalizeError } from "@/lib/errors/errors";
import { QueryClient } from "@tanstack/react-query";
import { LoaderFunctionArgs, Outlet } from "react-router";

const ContentLayout = () => {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
};

export const clientLoader =
  (queryClient: QueryClient) => async (_context: LoaderFunctionArgs) => {
    await queryClient.prefetchQuery(getCategoriesQueryOptions());
    // TODO find a better approach then just calling  getUser to check auth status,will do for now
    console.log(document.cookie, "check this");
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

export default ContentLayout;
