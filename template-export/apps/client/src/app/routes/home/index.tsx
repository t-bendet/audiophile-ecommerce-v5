import { Container } from "@/components/ui/container";
import { Metadata } from "@/components/seo/metadata";
import { Section } from "@/components/ui/section";

export const clientLoader = () => () => {
  return null;
};

export default function HomePage() {
  return (
    <>
      <Metadata
        title="Home"
        description="Welcome to the monorepo template"
      />
      <Container>
        <Section>
          <div className="text-center py-20">
            <h1 className="text-4xl font-bold mb-4">
              Welcome to the Template
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              This is a minimal template demonstrating authentication and navigation.
            </p>
            <p className="mt-4 text-neutral-600 dark:text-neutral-400">
              The navbar above shows categories and cart functionality.
              Try logging in or signing up to see protected features.
            </p>
          </div>
        </Section>
      </Container>
    </>
  );
}
