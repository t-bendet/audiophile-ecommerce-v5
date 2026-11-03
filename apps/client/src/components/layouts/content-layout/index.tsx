import { Footer } from "@/components/layouts/content-layout/footer";
import { Navbar } from "@/components/layouts/content-layout/nav-bar";
import { PendingOutlet } from "@/components/layouts/content-layout/pending-outlet";

const ContentLayout = () => {
  return (
    <>
      <Navbar />
      <PendingOutlet />
      <Footer />
    </>
  );
};

export default ContentLayout;
