import { Footer } from "@/components/layouts/content-layout/footer";
import { Navbar } from "@/components/layouts/content-layout/nav-bar";
import { getAuthStatusQueryOptions, getUserQueryOptions } from "@/lib/auth";
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

export default ContentLayout;

export const clientLoader =
  (queryClient: QueryClient) => async (_context: LoaderFunctionArgs) => {
    const authResponse = await queryClient.ensureQueryData(
      getAuthStatusQueryOptions(),
    );
    if (authResponse.data.isAuthenticated) {
      await queryClient.refetchQueries(getUserQueryOptions());
    }
    return null;
  };
