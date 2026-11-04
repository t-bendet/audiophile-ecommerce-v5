import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { paths } from "@/config/paths";
import { ChevronsUpDown, IdCardLanyard, LogInIcon } from "lucide-react";
import { NavLink } from "react-router";

export default function AnonymousUserDropdown() {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button>
          <span className="sr-only">Open anonymous menu</span>
          <p className="capitalize">hello visitor!</p>
          <ChevronsUpDown className="ml-auto size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-white text-black" align="center">
        <DropdownMenuItem asChild className="cursor-pointer">
          <NavLink
            to={paths.auth.login.path}
            className="[&[aria-current=page]]:text-primary-500"
          >
            Log in
            <LogInIcon className="ml-auto size-4 text-primary-500" />
          </NavLink>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <NavLink
            to={paths.auth.signup.path}
            className="[&[aria-current=page]]:text-primary-500"
          >
            Sign up
            <IdCardLanyard className="ml-auto size-4 text-primary-500" />
          </NavLink>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
