import { Section } from "@/components/ui/section";
import { SignupForm } from "@/features/auth/signup-form";
import { Metadata } from "@/components/seo/metadata";

export default function SignupPage() {
  return (
    <Section classes="tracking-200 max-w-md min-w-xs">
      <Metadata title="Create Account" noIndex />
      <SignupForm />
    </Section>
  );
}
