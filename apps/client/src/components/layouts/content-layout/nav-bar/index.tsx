import CartIcon from "@/assets/icon-cart.svg?react";
import Logo from "@/assets/logo.svg?react";
import { SafeRenderWithErrorBlock } from "@/components/errors/safe-render-with-error-block";
import NavBarDialog from "@/components/layouts/content-layout/nav-bar/nav-bar-dialog";
import { Container } from "@/components/ui/container";
import { paths } from "@/config/paths";
import useMedia from "@/hooks/useMedia";
import { HomeIcon } from "lucide-react";
import { Link } from "react-router";
import { NavLinks } from "./nav-links";
import { UserDropdown } from "./user-avatar-dropdown";

export const Navbar = () => {
  const isLarge = useMedia("lg");
  const isSmall = useMedia("sm");
  return (
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
            <SafeRenderWithErrorBlock
              title="Error loading categories navigation"
              containerClasses=""
            >
              <NavLinks />
            </SafeRenderWithErrorBlock>
          )}
          <div className="flex items-center">
            <UserDropdown />
            <CartIcon
              className="hover:*:fill-primary-500 focus-visible:*:fill-primary-500 cursor-pointer"
              title="cart icon"
            />
          </div>
        </div>
      </Container>
    </nav>
  );
};
