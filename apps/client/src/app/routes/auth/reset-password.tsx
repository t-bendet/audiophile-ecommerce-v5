import { Metadata } from "@/components/seo/metadata";
import { Section } from "@/components/ui/section";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <Section classes="max-w-md min-w-xs tracking-200">
      <Metadata title="Set a new password" noIndex />
      <ResetPasswordForm />
    </Section>
  );
}
