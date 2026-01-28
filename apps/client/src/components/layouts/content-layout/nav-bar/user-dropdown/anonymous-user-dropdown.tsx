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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <span className="sr-only">Open anonymous menu</span>
          <p className="capitalize">hello visitor!</p>
          <ChevronsUpDown className="ml-auto size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-white text-black" align="center">
        <DropdownMenuItem className="cursor-pointer">
          <NavLink
            to={paths.auth.login.path}
            className={({ isActive }) => (isActive ? "text-primary-500" : "")}
          >
            Log in
          </NavLink>
          <LogInIcon className="text-primary-500 ml-auto size-4" />
        </DropdownMenuItem>
        <DropdownMenuItem>
          <NavLink
            to={paths.auth.signup.path}
            className={({ isActive }) => (isActive ? "text-primary-500" : "")}
          >
            Sign up
          </NavLink>
          <IdCardLanyard className="text-primary-500 ml-auto size-4" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
