import { Section } from "@/components/ui/section";
import { LoginForm } from "@/features/auth/components/login-form";
import { Metadata } from "@/components/seo/metadata";

export default function LoginPage() {
  return (
    <Section classes="max-w-md min-w-xs tracking-200">
      <Metadata title="Login" noIndex />
      <LoginForm />
    </Section>
  );
}
