// PROTOTYPE (#359): the navigation pending state, per loading variant, around the content outlet.
import { useLayoutEffect } from "react";
import { Outlet, useLocation, useNavigation } from "react-router";
import { hasSkeleton } from "./helpers";
import { SkeletonForPath } from "./skeletons";
import { useProto } from "./store";

export const ProgressBar = () => (
  <div
    className="pointer-events-none fixed inset-x-0 top-0 z-60 h-1 overflow-hidden"
    role="progressbar"
    aria-label="Loading page"
  >
    <div className="h-full w-1/3 animate-[proto-progress_1.1s_ease-in-out_infinite] bg-primary-500" />
    <style>{`@keyframes proto-progress { 0% { transform: translateX(-100%) } 100% { transform: translateX(300%) } }`}</style>
  </div>
);

export const PrototypeOutlet = () => {
  const { loading } = useProto();
  const navigation = useNavigation();
  const location = useLocation();
  const target = navigation.location;
  const pending =
    navigation.state === "loading" &&
    !!target &&
    target.pathname !== location.pathname;

  if (loading === "A") {
    return (
      <>
        {pending && <ProgressBar />}
        <div
          className={
            pending
              ? "opacity-40 transition-opacity delay-150 duration-300"
              : "transition-opacity"
          }
          aria-busy={pending}
        >
          <Outlet />
        </div>
      </>
    );
  }

  // A route without a skeleton keeps the old page, as today.
  if (loading === "C" && pending && hasSkeleton(target.pathname)) {
    return <PendingSkeleton pathname={target.pathname} />;
  }

  return <Outlet />;
};

// The skeleton is the top of the next page, so it starts at the top.
const PendingSkeleton = ({ pathname }: { pathname: string }) => {
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return <SkeletonForPath pathname={pathname} />;
};
