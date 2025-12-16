import { Button } from "@components/ui/button";
// import { useRouteError } from "react-router-dom";

export const MainErrorFallback = () => {
  // const error = useRouteError();
  return (
    <div
      className="flex h-screen w-screen flex-col items-center justify-center bg-neutral-800 text-red-500"
      role="alert"
    >
      <h2 className="text-lg font-semibold">Ooops, something went wrong :( </h2>
      <Button
        className="bg-primary-500 hover:bg-primary-400 mt-4"
        onClick={() => window.location.assign(window.location.origin)}
      >
        Refresh
      </Button>
    </div>
  );
};
