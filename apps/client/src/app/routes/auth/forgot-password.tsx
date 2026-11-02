import { Metadata } from "@/components/seo/metadata";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <>
      <Metadata title="Forgot password" noIndex />
      <ForgotPasswordForm />
    </>
  );
}
