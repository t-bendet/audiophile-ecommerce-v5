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
import { getUserQueryOptions, useLogoutUser } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronsUpDown, LogOut } from "lucide-react";
import { NavLink, useNavigate } from "react-router";

export default function LoggedInUserDropdown() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mutate: logout } = useLogoutUser(queryClient);
  const { data: user, isLoading, isError } = useQuery(getUserQueryOptions());
  // TODO usesuspense with a fallback loader
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (isError) {
    return <div>Error loading user data</div>;
  }
  if (!user) {
    return <div className="bg-black">No user data available</div>;
  }

  const handleLogout = async () => {
    try {
      navigate(paths.home.getHref(), { replace: true });
      logout({});

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
          <DropdownMenuItem>
            <NavLink
              to={paths.account.profile.path}
              className={({ isActive }) => (isActive ? "text-primary-500" : "")}
            >
              Profile
            </NavLink>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <NavLink
              to={paths.account.security.path}
              className={({ isActive }) => (isActive ? "text-primary-500" : "")}
            >
              Security
            </NavLink>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <NavLink
              to={paths.account.orders.path}
              className={({ isActive }) => (isActive ? "text-primary-500" : "")}
            >
              Orders
            </NavLink>
          </DropdownMenuItem>
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
