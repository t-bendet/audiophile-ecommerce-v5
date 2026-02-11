import { Section } from "@/components/ui/section";
import { LoginForm } from "@/features/auth/login-form";
import { Metadata } from "@/components/seo/metadata";

export default function LoginPage() {
  return (
    <Section classes="tracking-200 max-w-md min-w-xs">
      <Metadata title="Login" noIndex />
      <LoginForm />
    </Section>
  );
}
