import { SignupForm } from "@/features/auth/components/signup-form";
import { Metadata } from "@/components/seo/metadata";

export default function SignupPage() {
  return (
    <>
      <Metadata title="Create Account" noIndex />
      <SignupForm />
    </>
  );
}
