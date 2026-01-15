import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { paths } from "@/config/paths";
import { UserDTO } from "@repo/domain";
import { ChevronsUpDown, IdCardLanyard, LogInIcon, LogOut } from "lucide-react";
import { NavLink } from "react-router";

function LoggedInUserDropdown({ user }: { user: UserDTO }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <span className="sr-only">Open user menu</span>
          <p className="capitalize">hello {user.name}!</p>
          <ChevronsUpDown className="ml-auto size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-white text-black" align="center">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <Separator />
        <DropdownMenuGroup>
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Billing</DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        <DropdownMenuSeparator />
        <DropdownMenuItem>
          Log out
          <LogOut className="text-primary-700 ml-auto size-4" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AnonymousUserDropdown() {
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
        <DropdownMenuItem>
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

export function UserDropdown() {
  // TODO demo purpose only,replace with actual user data
  const user = {
    id: "693a9c77b06139c25ec24112",
    name: "admin",
    email: "admin@example.com",
    role: "ADMIN" as const,
    emailVerified: false,
    createdAt: new Date("2023-10-11T10:20:30Z"),
    v: 0,
  };

  return !user ? (
    <LoggedInUserDropdown user={user} />
  ) : (
    <AnonymousUserDropdown />
  );
}
