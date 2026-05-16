import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { toast } from "sonner";
import { LogIn } from "lucide-react";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/" });
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const isPhone = /^\+?\d{6,}$/.test(identifier.trim());
    const creds = isPhone
      ? { phone: identifier.trim(), password }
      : { email: identifier.trim(), password };
    const { error } = await supabase.auth.signInWithPassword(creds as any);
    setLoading(false);
    if (error) {
      toast.error("بيانات الدخول غير صحيحة");
      return;
    }
    toast.success("تم تسجيل الدخول");
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12">
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground">
            <LogIn className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-black">تسجيل الدخول</h1>
          <p className="mt-1 text-sm text-muted-foreground">أهلاً بعودتك إلى سوقنا</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl bg-card p-6 ring-1 ring-border/50">
          <Field label="البريد الإلكتروني أو رقم الهاتف">
            <input
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="example@mail.com أو +9665..."
              className="input"
            />
          </Field>
          <Field label="كلمة المرور">
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
          </Field>
          <button
            disabled={loading}
            className="w-full rounded-lg bg-primary py-3 font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "جاري الدخول..." : "تسجيل الدخول"}
          </button>
          <p className="text-center text-sm text-muted-foreground">
            ليس لديك حساب؟{" "}
            <Link to="/signup" className="font-bold text-primary hover:underline">
              أنشئ حساب جديد
            </Link>
          </p>
        </form>
      </main>
      <Footer />
      <style>{`.input{width:100%;height:42px;border-radius:.5rem;padding:0 .75rem;background:var(--color-secondary);border:1px solid color-mix(in oklab,var(--color-primary) 25%,transparent);color:var(--color-foreground);outline:none;}.input:focus{border-color:var(--color-primary);box-shadow:0 0 0 3px color-mix(in oklab,var(--color-primary) 20%,transparent);}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}
