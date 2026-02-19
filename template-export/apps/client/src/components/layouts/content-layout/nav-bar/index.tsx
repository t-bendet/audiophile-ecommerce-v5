import CartIcon from "@/assets/icon-cart.svg?react";
import Logo from "@/assets/logo.svg?react";
import { SafeRenderWithErrorBlock } from "@/components/errors/safe-render-with-error-block";
import NavBarDialog from "@/components/layouts/content-layout/nav-bar/nav-bar-dialog";
import { Container } from "@/components/ui/container";
import { paths } from "@/config/paths";
import { useCart } from "@/features/cart/api/get-cart";
import { MiniCart } from "@/features/cart/components/mini-cart";
import useMedia from "@/hooks/useMedia";
import { HomeIcon } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { NavLinks } from "./nav-links";
import { UserDropdown } from "./user-dropdown";
import LoadingSpinner from "@/components/ui/loading-spinner";

export const Navbar = () => {
  const isLarge = useMedia("lg");
  const isSmall = useMedia("sm");
  const [cartOpen, setCartOpen] = useState(false);
  const { data: cart } = useCart();

  return (
    <>
      <nav className="bg-neutral-900 max-md:border-b max-md:border-neutral-100/20">
        <Container>
          <div className="flex h-(--nav-bar-height) items-center justify-between md:border-b md:border-neutral-100/20">
            {!isLarge && <NavBarDialog />}
            {isSmall ? (
              <Link
                to={paths.home.path}
                className="hover:*:*:fill-primary-500 focus-visible:*:*:fill-primary-500 max-lg:mr-auto max-lg:pl-11"
              >
                <Logo title="audiophile logo" />
              </Link>
            ) : (
              <Link
                to={paths.home.path}
                className="hover:*:*:stroke-primary-400 focus-visible:*:*:stroke-primary-500 mr-auto pl-4"
              >
                <HomeIcon />
              </Link>
            )}

            {isLarge && (
              <SafeRenderWithErrorBlock title="Error loading categories navigation">
                <NavLinks />
              </SafeRenderWithErrorBlock>
            )}
            <div className="flex items-center gap-4">
              <SafeRenderWithErrorBlock
                title="Error loading user dropdown"
                fallback={<LoadingSpinner size="md" className="mr-12" />}
              >
                <UserDropdown />
              </SafeRenderWithErrorBlock>
              <button
                onClick={() => setCartOpen(true)}
                className="relative hover:*:fill-primary-500 focus-visible:*:fill-primary-500 cursor-pointer"
                aria-label="Open cart"
              >
                <CartIcon title="cart icon" />
                {cart?.data.itemCount && cart.data.itemCount > 0 ? (
                  <span className="absolute -top-2 -right-2 bg-primary-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cart.data.itemCount}
                  </span>
                ) : null}
              </button>
            </div>
          </div>
        </Container>
      </nav>
      <MiniCart open={cartOpen} onOpenChange={setCartOpen} />
    </>
  );
};
