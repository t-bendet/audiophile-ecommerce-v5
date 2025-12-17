import { Outlet } from "react-router";
import { Footer } from "@/components/layouts/content-layout/footer";
import { Navbar } from "@/components/layouts/content-layout/nav-bar";

export const ContentLayout = () => {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
};
