import { Section } from "@/components/ui/section";
import { SignupForm } from "@/features/auth/components/signup-form";
import { Metadata } from "@/components/seo/metadata";

export default function SignupPage() {
  return (
    <Section classes="tracking-200 min-w-xs max-w-md">
      <Metadata title="Create Account" noIndex />
      <SignupForm />
    </Section>
  );
}
