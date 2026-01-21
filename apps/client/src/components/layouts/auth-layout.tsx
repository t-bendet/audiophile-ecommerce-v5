import { QueryClient } from "@tanstack/react-query";
import { LoaderFunctionArgs, Outlet } from "react-router";

// TODO add go home link if user lands here by mistake

const AuthLayout = () => {
  return (
    <main className="bg-muted flex min-h-svh flex-col items-center gap-6 px-6 pt-10 md:pt-26">
      <Outlet />
    </main>
  );
};

export default AuthLayout;

export const clientLoader =
  (queryClient: QueryClient) => async (context: LoaderFunctionArgs) => {
    console.log({ context });
  };
