import HamburgerIcon from "@/assets/icon-hamburger.svg?react";
import ErrorBlock from "@/components/errors/ErrorBlock";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getCategoriesQueryOptions } from "@/features/categories/api/get-categories";
import CategoryNavDropdown from "@/features/categories/components/category-nav-dropdown";
import { useQueryClient } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import LoadingSpinner from "../../loading-spinner";

export default function NavBarDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

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
        className="fixed inset-0 top-(--nav-bar-height) w-full max-w-full translate-x-[0] translate-y-[0] rounded-t-none max-sm:overflow-scroll sm:max-w-full md:bottom-auto"
      >
        <DialogTitle className="sr-only">Main menu</DialogTitle>
        <DialogDescription className="sr-only">
          Make changes to your profile here. Click save when you&apos;re done.
        </DialogDescription>

        <ErrorBoundary
          FallbackComponent={({ error, resetErrorBoundary }) => (
            <Container classes="mb-30">
              <div className="flex items-center justify-center">
                <ErrorBlock
                  title={`Error loading categories`}
                  message={error.message}
                  onReset={resetErrorBoundary}
                />
              </div>
            </Container>
          )}
          onReset={() => {
            queryClient.prefetchQuery(getCategoriesQueryOptions());
          }}
        >
          <Suspense fallback={<LoadingSpinner />}>
            <CategoryNavDropdown clickHandler={() => setOpen(false)} />
          </Suspense>
        </ErrorBoundary>
      </DialogContent>
    </Dialog>
  );
}
