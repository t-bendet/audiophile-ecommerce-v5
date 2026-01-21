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
import { useToast } from "@/hooks/use-toast";
import { getApi } from "@/lib/api-client";
import { USER_QUERY_KEY } from "@/lib/auth";
import { UserDTO } from "@repo/domain";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronsUpDown, IdCardLanyard, LogInIcon, LogOut } from "lucide-react";
import { Activity } from "react";
import { NavLink, useNavigate } from "react-router";

function LoggedInUserDropdown({ user }: { user: UserDTO }) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try {
      const api = getApi();
      await api.get("/auth/logout");

      // Clear user from cache
      queryClient.setQueryData([USER_QUERY_KEY], null);

      // Redirect to home
      navigate(paths.home.getHref());

      toast({
        title: "Logged out successfully",
        description: "See you soon!",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "Please try again",
        variant: "destructive",
        duration: 3000,
      });
    }
  };
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

        <DropdownMenuItem onClick={handleLogout}>
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
  // TODO demo purpose only,replace with actual user data,add user call
  const user = {
    id: "693a9c77b06139c25ec24112",
    name: "admin",
    email: "admin@example.com",
    role: "ADMIN" as const,
    emailVerified: false,
    createdAt: new Date("2023-10-11T10:20:30Z"),
    v: 0,
  };

  return (
    <>
      <Activity mode={user.id ? "visible" : "hidden"}>
        <LoggedInUserDropdown user={user} />
      </Activity>
      <Activity mode={!user.id ? "visible" : "hidden"}>
        <AnonymousUserDropdown />
      </Activity>
    </>
  );
}
