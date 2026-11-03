// PROTOTYPE (#359): what the account menu shows before the auth status or the user is cached.
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { ChevronsUpDown } from "lucide-react";
import { useProto } from "./store";

export function MenuFallback() {
  const { menu } = useProto();

  if (menu === "A") {
    return (
      <div
        role="status"
        aria-label="Loading your account"
        className="flex h-9 w-36 items-center gap-2 px-4"
      >
        <Skeleton className="h-3 flex-1 bg-white/20" />
        <ChevronsUpDown className="size-4 opacity-30" aria-hidden />
      </div>
    );
  }

  if (menu === "B") {
    return (
      <Button disabled aria-busy className="disabled:opacity-60">
        <span className="sr-only">Open account menu</span>
        <p className="capitalize">hello!</p>
        <ChevronsUpDown className="ml-auto size-4" />
      </Button>
    );
  }

  return <LoadingSpinner size="md" className="mr-12" />;
}
