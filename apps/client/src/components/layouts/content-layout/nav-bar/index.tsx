import CartIcon from "@/assets/icon-cart.svg?react";
import Logo from "@/assets/logo.svg?react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Container } from "@/components/ui/container";
import { paths } from "@/config/paths";
import useMedia from "@/hooks/useMedia";
import { Link } from "react-router-dom";
import { NavLinks } from "@/components/layouts/nav-links";
import NavBarDialog from "@/components/layouts/content-layout/nav-bar/nav-bar-dialog";

function AvatarDemo() {
  return (
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback className="text-primary-400">CN</AvatarFallback>
    </Avatar>
  );
}

export const Navbar = () => {
  const isLarge = useMedia("lg");
  return (
    <nav className="bg-neutral-900 max-md:border-b max-md:border-neutral-100/20">
      <Container>
        <div className="flex h-[var(--nav-bar-height)] items-center justify-between md:border-b md:border-neutral-100/20">
          {!isLarge && <NavBarDialog />}
          <Link
            to={paths.home.path}
            className="hover:*:*:fill-primary-500 focus-visible:*:*:fill-primary-500 md:max-lg:mr-auto md:max-lg:pl-11"
          >
            <Logo title="audiophile logo" />
          </Link>
          {isLarge && <NavLinks />}
          <div className="flex items-center gap-4">
            <CartIcon
              className="hover:*:fill-primary-500 focus-visible:*:fill-primary-500 cursor-pointer"
              title="cart icon"
            />
            <AvatarDemo />
          </div>
        </div>
      </Container>
    </nav>
  );
};
