import { Section } from "@/components/ui/section";
import { LoginForm } from "@/features/auth/login-form";

export default function LoginPage() {
  return (
    <Section classes="tracking-200 max-w-md min-w-xs">
      <LoginForm />
    </Section>
  );
}
