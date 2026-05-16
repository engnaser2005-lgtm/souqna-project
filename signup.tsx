import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { toast } from "sonner";
import { UserPlus, Store, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/signup")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/" });
  },
  component: SignupPage,
});

type AccountType = "buyer" | "seller";

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("buyer");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    setLoading(true);
    const isPhone = /^\+?\d{6,}$/.test(identifier.trim());
    const payload: any = {
      password,
      options: {
        data: { username: name.trim(), account_type: accountType },
        emailRedirectTo: window.location.origin,
      },
    };
    if (isPhone) payload.phone = identifier.trim();
    else payload.email = identifier.trim();

    const { error } = await supabase.auth.signUp(payload);
    setLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes("registered")) {
        toast.error("هذا الحساب مسجّل مسبقاً");
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success("تم إنشاء الحساب بنجاح");
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12">
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground">
            <UserPlus className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-black">إنشاء حساب جديد</h1>
          <p className="mt-1 text-sm text-muted-foreground">انضم إلى سوقنا في خطوات بسيطة</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl bg-card p-6 ring-1 ring-border/50">
          <div>
            <span className="mb-2 block text-sm font-semibold">نوع الحساب</span>
            <div className="grid grid-cols-2 gap-2">
              <TypeOption
                active={accountType === "buyer"}
                onClick={() => setAccountType("buyer")}
                icon={<ShoppingBag className="h-5 w-5" />}
                label="مشتري"
                desc="تصفح وشراء المنتجات"
              />
              <TypeOption
                active={accountType === "seller"}
                onClick={() => setAccountType("seller")}
                icon={<Store className="h-5 w-5" />}
                label="بائع"
                desc="اعرض منتجاتك للبيع"
              />
            </div>
          </div>

          <Field label="الاسم">
            <input required value={name} onChange={(e) => setName(e.target.value)} className="input" />
          </Field>
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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
          </Field>

          <button
            disabled={loading}
            className="w-full rounded-lg bg-primary py-3 font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "جاري الإنشاء..." : "إنشاء الحساب"}
          </button>
          <p className="text-center text-sm text-muted-foreground">
            لديك حساب؟{" "}
            <Link to="/login" className="font-bold text-primary hover:underline">سجّل الدخول</Link>
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

function TypeOption({
  active, onClick, icon, label, desc,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; desc: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-1 rounded-lg border-2 p-3 text-start transition ${
        active
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border/40 bg-secondary/40 hover:border-primary/40"
      }`}
    >
      <div className={`grid h-8 w-8 place-items-center rounded-md ${active ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
        {icon}
      </div>
      <span className="font-bold">{label}</span>
      <span className="text-xs text-muted-foreground">{desc}</span>
    </button>
  );
}
