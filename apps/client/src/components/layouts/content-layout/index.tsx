import { Outlet } from "react-router-dom";
import { Footer } from "./footer";
import { Navbar } from "./nav-bar";

export const ContentLayout = () => {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
};
