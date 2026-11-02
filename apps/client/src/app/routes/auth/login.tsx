import { LoginForm } from "@/features/auth/components/login-form";
import { Metadata } from "@/components/seo/metadata";

export default function LoginPage() {
  return (
    <>
      <Metadata title="Login" noIndex />
      <LoginForm />
    </>
  );
}
