import { Metadata } from "@/components/seo/metadata";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <>
      <Metadata title="Set a new password" noIndex />
      <ResetPasswordForm />
    </>
  );
}
