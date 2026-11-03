import { ProgressBar } from "@/components/ui/progress-bar";
import { Outlet, useLocation, useNavigation } from "react-router";

export const PendingOutlet = () => {
  const navigation = useNavigation();
  const location = useLocation();
  const target = navigation.location;
  const pending =
    navigation.state === "loading" &&
    !!target &&
    target.pathname !== location.pathname;

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
};
