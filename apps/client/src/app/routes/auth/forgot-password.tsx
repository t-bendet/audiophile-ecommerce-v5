import { Metadata } from "@/components/seo/metadata";
import { Section } from "@/components/ui/section";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <Section classes="max-w-md min-w-xs tracking-200">
      <Metadata title="Forgot password" noIndex />
      <ForgotPasswordForm />
    </Section>
  );
}
