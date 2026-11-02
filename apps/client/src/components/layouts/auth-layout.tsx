import { currentUserContext } from "@/app/middleware/auth";
import authSpeakerImg from "@/assets/desktop/image-auth-speaker.png";
import Logo from "@/assets/logo.svg?react";
import PatternCircles from "@/assets/pattern-circles.svg?react";
import { Button } from "@/components/ui/button";
import { paths } from "@/config/paths";
import { getAuthStatusQueryOptions } from "@/lib/auth";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Link, LoaderFunctionArgs, Outlet, redirect } from "react-router";

const AuthLayout = () => {
  useQuery(getAuthStatusQueryOptions());
  return (
    // Two auto rows would share a phone's spare height and stretch the band.
    <div className="grid min-h-svh grid-rows-[auto_1fr] bg-neutral-100 text-neutral-900 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-rows-1">
      <aside className="relative flex h-18 items-center justify-between overflow-hidden bg-neutral-900 px-6 text-neutral-100 lg:h-auto lg:flex-col lg:items-start lg:p-12">
        <Link
          to={paths.home.getHref()}
          className="relative z-10 hover:*:*:fill-primary-500 focus-visible:*:*:fill-primary-500"
        >
          <Logo title="audiophile logo" />
        </Link>
        <Link
          to={paths.home.getHref()}
          className="relative z-10 flex items-center gap-2 text-xs font-bold tracking-600 uppercase opacity-60 hover:opacity-100 focus-visible:opacity-100 lg:hidden"
        >
          <ArrowLeft className="size-4" />
          Home
        </Link>
        <div className="relative hidden w-full flex-1 items-center justify-center lg:flex">
          {/* The asset has no viewBox and the global svg rule caps size at 100%, so both are overridden to let CSS width scale the rings. */}
          <PatternCircles
            aria-hidden
            viewBox="0 0 944 944"
            className="pointer-events-none absolute top-1/2 left-1/2 h-auto max-h-none w-[160%] max-w-none -translate-1/2 opacity-40"
          />
          <img
            src={authSpeakerImg}
            alt=""
            width={756}
            height={918}
            className="relative max-h-[60vh] w-auto"
          />
        </div>
        <p className="relative z-10 hidden text-2xl font-bold tracking-300 uppercase lg:block">
          Bringing you the <span className="text-primary-500">best</span> audio
          gear
        </p>
      </aside>
      <main className="flex flex-col px-6 pt-10 pb-16 lg:px-20 lg:py-12">
        <div className="hidden justify-end lg:flex">
          <Button variant="link" asChild className="gap-2 px-0">
            <Link to={paths.home.getHref()}>
              <ArrowLeft className="size-4" />
              Back to Home
            </Link>
          </Button>
        </div>
        <div className="w-full max-w-md lg:my-auto lg:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AuthLayout;

export const clientLoader =
  (_queryClient: QueryClient) =>
  async ({ context }: LoaderFunctionArgs) => {
    if (context.get(currentUserContext)) {
      // Already signed in: there is nothing to log in to.
      throw redirect(paths.account.profile.path);
    }
    return null;
  };
