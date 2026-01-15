import { QueryClient } from "@tanstack/react-query";
import { LoaderFunctionArgs, Outlet } from "react-router";

export default function UserAreaLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Outlet />
    </div>
  );
}

export const clientLoader =
  (queryClient: QueryClient) => async (context: LoaderFunctionArgs) => {
    console.log({ context });
    return null;
  };
