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
import { getUserQueryOptions, useLogoutUser } from "@/lib/auth";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ChevronsUpDown, LayoutDashboard, LogOut } from "lucide-react";
import { NavLink, useNavigate } from "react-router";
import { toast } from "sonner";

export default function LoggedInUserDropdown() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mutate: logout } = useLogoutUser(queryClient);
  const { data: user } = useSuspenseQuery(getUserQueryOptions());

  const handleLogout = async () => {
    try {
      navigate(paths.home.getHref(), { replace: true });
      logout({});

      toast.success("Logged out successfully", {
        description: "See you soon!",
      });
    } catch {
      toast.error("Logout failed", { description: "Please try again" });
    }
  };
  return (
    <DropdownMenu modal={false}>
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
          <DropdownMenuItem asChild>
            <NavLink
              to={paths.account.profile.path}
              className="[&[aria-current=page]]:text-primary-500"
            >
              Profile
            </NavLink>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <NavLink
              to={paths.account.security.path}
              className="[&[aria-current=page]]:text-primary-500"
            >
              Security
            </NavLink>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <NavLink
              to={paths.account.orders.path}
              className="[&[aria-current=page]]:text-primary-500"
            >
              Orders
            </NavLink>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        {user.role === "ADMIN" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <NavLink
                to={paths.admin.root.getHref()}
                className="[&[aria-current=page]]:text-primary-500"
              >
                Admin
                <LayoutDashboard className="ml-auto size-4 text-primary-500" />
              </NavLink>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleLogout}>
          Log out
          <LogOut className="ml-auto size-4 text-primary-700" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
