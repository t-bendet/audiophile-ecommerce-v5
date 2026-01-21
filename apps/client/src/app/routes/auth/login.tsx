import { LoginForm } from "@/features/auth/login-form";

export default function LoginPage() {
  return (
    <section className="tracking-200 flex w-full max-w-sm flex-col gap-6">
      <LoginForm />
    </section>
  );
}
