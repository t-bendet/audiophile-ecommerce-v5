import { Footer } from "@/components/layouts/content-layout/footer";
import { Navbar } from "@/components/layouts/content-layout/nav-bar";
import { PrototypeOutlet } from "@/components/prototype/storefront-loading/pending";

const ContentLayout = () => {
  return (
    <>
      <Navbar />
      {/* PROTOTYPE (#359): pending state per loading variant. */}
      <PrototypeOutlet />
      <Footer />
    </>
  );
};

export default ContentLayout;
