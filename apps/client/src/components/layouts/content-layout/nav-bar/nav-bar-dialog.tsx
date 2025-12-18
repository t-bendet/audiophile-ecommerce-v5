import HamburgerIcon from "@/assets/icon-hamburger.svg?react";
import { SafeRenderWithErrorBlock } from "@/components/errors/SafeRenderWithErrorBlock";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import CategoryNavDropdown from "@/features/categories/components/category-nav-dropdown";
import { useState } from "react";

export default function NavBarDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog defaultOpen={false} open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="hover:*:*:fill-primary-500 focus-visible:*:*:fill-primary-500 h-4 p-0">
          <span className="sr-only">Open main menu</span>
          <HamburgerIcon className="" title="hamburger icon" />
        </Button>
      </DialogTrigger>
      <DialogContent
        aria-describedby="main-menu"
        showCloseButton={false}
        className="fixed inset-0 top-(--nav-bar-height) w-full max-w-full translate-x-0 translate-y-0 rounded-t-none max-sm:overflow-scroll sm:max-w-full md:bottom-auto"
      >
        <DialogTitle className="sr-only">Main menu</DialogTitle>
        <DialogDescription className="sr-only">
          Make changes to your profile here. Click save when you&apos;re done.
        </DialogDescription>

        <SafeRenderWithErrorBlock
          title="Error loading categories"
          containerClasses="mb-30"
        >
          <CategoryNavDropdown clickHandler={() => setOpen(false)} />
        </SafeRenderWithErrorBlock>
      </DialogContent>
    </Dialog>
  );
}
