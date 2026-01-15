import { LoginForm } from "@/features/auth/login-form";

export default function LoginPage() {
  return (
    <main className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <section className="tracking-200 flex w-full max-w-sm flex-col gap-6">
        <LoginForm />
      </section>
    </main>
  );
}
