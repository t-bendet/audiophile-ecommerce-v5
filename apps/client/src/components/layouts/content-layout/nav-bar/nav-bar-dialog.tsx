import HamburgerIcon from "@/assets/icon-hamburger.svg?react";
import { SafeRenderWithErrorBlock } from "@/components/errors/safe-render-with-error-block";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import CategoryNavList from "@/features/categories/components/category-nav-list";
import { useState } from "react";

export default function NavBarDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-4 p-0 hover:*:*:fill-primary-500 focus-visible:*:*:fill-primary-500">
          <span className="sr-only">Open main menu</span>
          <HamburgerIcon title="hamburger icon" />
        </Button>
      </DialogTrigger>
      <DialogContent
        placement="sheet-top"
        belowNav
        title="Main menu"
        srOnlyTitle
        className="px-6 pt-20 pb-8 md:px-10 md:py-14"
      >
        <SafeRenderWithErrorBlock
          title="Error loading categories"
          containerClasses="mb-30"
        >
          <CategoryNavList clickHandler={() => setOpen(false)} />
        </SafeRenderWithErrorBlock>
      </DialogContent>
    </Dialog>
  );
}
