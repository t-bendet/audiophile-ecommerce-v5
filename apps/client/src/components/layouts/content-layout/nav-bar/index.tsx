import Logo from "@/assets/logo.svg?react";
import { SafeRenderWithErrorBlock } from "@/components/errors/safe-render-with-error-block";
import {
  PrototypeMenu,
  PrototypeMiniCart,
} from "@/components/prototype/storefront-loading/dialogs";
import { MenuFallback } from "@/components/prototype/storefront-loading/menu-fallback";
import { Container } from "@/components/ui/container";
import { paths } from "@/config/paths";
import useMedia from "@/hooks/useMedia";
import { HomeIcon } from "lucide-react";
import { Link } from "react-router";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { CartButton } from "./cart-button";
import { NavLinks } from "./nav-links";
import { UserDropdown } from "./user-dropdown";

export const Navbar = () => {
  const isLarge = useMedia("lg");
  const isSmall = useMedia("sm");

  return (
    <nav className="bg-neutral-900 max-md:border-b max-md:border-neutral-100/20">
      <Container>
        <div className="flex h-(--nav-bar-height) items-center justify-between md:border-b md:border-neutral-100/20">
          {/* PROTOTYPE (#359): one dialog primitive for menu and mini-cart. */}
          {!isLarge && <PrototypeMenu />}
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
              aria-label="Home"
              className="mr-auto pl-4 hover:*:*:stroke-primary-400 focus-visible:*:*:stroke-primary-500"
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
              fallback={<MenuFallback />}
            >
              <UserDropdown />
            </SafeRenderWithErrorBlock>
            <SafeRenderWithErrorBlock
              title="Error loading cart"
              fallback={<LoadingSpinner size="md" />}
            >
              <PrototypeMiniCart trigger={<CartButton />} />
            </SafeRenderWithErrorBlock>
          </div>
        </div>
      </Container>
    </nav>
  );
};
