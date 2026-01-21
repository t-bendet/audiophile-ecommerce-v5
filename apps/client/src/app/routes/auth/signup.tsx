import { SignupForm } from "@/features/auth/signup-form";

export default function SignupPage() {
  return (
    <section className="flex w-full max-w-sm flex-col gap-6">
      <SignupForm />
    </section>
  );
}
