import { Section } from "@/components/ui/section";
import { SignupForm } from "@/features/auth/components/signup-form";
import { Metadata } from "@/components/seo/metadata";

export default function SignupPage() {
  return (
    <Section classes="max-w-md min-w-xs tracking-200">
      <Metadata title="Create Account" noIndex />
      <SignupForm />
    </Section>
  );
}
