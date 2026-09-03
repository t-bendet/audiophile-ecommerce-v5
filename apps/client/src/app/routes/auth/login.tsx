import { Section } from "@/components/ui/section";
import { LoginForm } from "@/features/auth/components/login-form";
import { Metadata } from "@/components/seo/metadata";

export default function LoginPage() {
  return (
    <Section classes="tracking-200 min-w-xs max-w-md">
      <Metadata title="Login" noIndex />
      <LoginForm />
    </Section>
  );
}
