import { Section } from "@/components/ui/section";
import { SignupForm } from "@/features/auth/signup-form";

export default function SignupPage() {
  return (
    <Section classes="tracking-200 max-w-md min-w-xs">
      <SignupForm />
    </Section>
  );
}
