import { Button } from "@/components/ui/button";
import { ChevronsUpDown } from "lucide-react";

export default function AccountMenuFallback() {
  return (
    <Button disabled aria-busy className="disabled:opacity-60">
      <span className="sr-only">Open user menu</span>
      <p className="capitalize">hello!</p>
      <ChevronsUpDown className="ml-auto size-4" />
    </Button>
  );
}
