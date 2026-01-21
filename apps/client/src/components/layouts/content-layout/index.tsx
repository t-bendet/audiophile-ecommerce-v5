import { Footer } from "@/components/layouts/content-layout/footer";
import { Navbar } from "@/components/layouts/content-layout/nav-bar";
import { USER_QUERY_KEY } from "@/lib/auth";
import {
  QueryClient,
  useIsFetching,
  useIsMutating,
} from "@tanstack/react-query";
import { LoaderFunctionArgs, Outlet } from "react-router";

const ContentLayout = () => {
  const isFetching = useIsFetching({ queryKey: [USER_QUERY_KEY] });
  const isMutating = useIsMutating({ mutationKey: [USER_QUERY_KEY] });

  const isLoading = isFetching + isMutating > 0;

  // console.log({ isLoading, isFetching, isMutating });
  // TODO add auth loader state handling here(or globally), e.g. show a top loading bar when user auth state is being checked/refetched
  // TODO move to root layout later
  return (
    <>
      {isLoading && (
        <div className="bg-primary-500 fixed top-0 left-0 z-50 h-1.5 w-full animate-pulse" />
      )}
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
};

export const clientLoader =
  (queryClient: QueryClient) => async (context: LoaderFunctionArgs) => {
    console.log("client loader for content layout");
  };

export default ContentLayout;
