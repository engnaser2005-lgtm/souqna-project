import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Copy, CreditCard, Wallet, ShieldCheck } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { BANK_INFO } from "@/lib/orders";

export const Route = createFileRoute("/products/$id/buy")({
  component: BuyPage,
});

type Product = {
  id: string; seller_id: string; title: string; price: number;
  images: string[]; quantity: number;
};

function BuyPage() {
  const { id } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [step, setStep] = useState<"confirm" | "payment">("confirm");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    (async () => {
      const { data, error } = await supabase
        .from("products").select("id, seller_id, title, price, images, quantity")
        .eq("id", id).maybeSingle();
      if (error || !data) { toast.error("لم يتم العثور على المنتج"); navigate({ to: "/" }); return; }
      if (data.seller_id === user.id) { toast.error("لا يمكنك شراء منتجك الخاص"); navigate({ to: "/products/$id", params: { id } }); return; }
      if (data.quantity < 1) { toast.error("نفذت الكمية"); navigate({ to: "/products/$id", params: { id } }); return; }
      setProduct(data);
      setLoading(false);
    })();
  }, [id, user, authLoading, navigate]);

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => toast.success(`تم نسخ ${label}`));
  }

  async function createOrder() {
    if (!product || !user) return;
    setCreating(true);
    const { data, error } = await supabase.from("orders").insert({
      buyer_id: user.id,
      seller_id: product.seller_id,
      product_id: product.id,
      quantity: qty,
      total_price: product.price * qty,
    }).select("id").single();
    setCreating(false);
    if (error || !data) { toast.error("فشل إنشاء الطلب"); return; }
    toast.success("تم إنشاء الطلب — يرجى رفع إيصال الدفع");
    navigate({ to: "/orders/$id/pay", params: { id: data.id } });
  }

  if (loading || !product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex min-h-[50vh] items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> جاري التحميل...
        </div>
      </div>
    );
  }

  const total = product.price * qty;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <nav className="mb-3 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">الرئيسية</Link>
          <span className="mx-2">/</span>
          <Link to="/products/$id" params={{ id }} className="hover:text-primary">{product.title}</Link>
          <span className="mx-2">/</span>
          <span>الشراء</span>
        </nav>

        {/* Steps indicator */}
        <div className="mb-6 flex items-center gap-2 text-xs">
          {["تأكيد الطلب", "الدفع", "رفع الإيصال"].map((s, i) => {
            const active = (step === "confirm" && i === 0) || (step === "payment" && i === 1);
            const done = step === "payment" && i === 0;
            return (
              <div key={s} className="flex items-center gap-2">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full font-bold ${done ? "bg-emerald-500 text-white" : active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>{i + 1}</span>
                <span className={active || done ? "font-bold text-foreground" : "text-muted-foreground"}>{s}</span>
                {i < 2 && <span className="mx-1 h-px w-6 bg-border" />}
              </div>
            );
          })}
        </div>

        {/* Product summary */}
        <div className="mb-5 flex gap-4 rounded-2xl border border-border/50 bg-card p-4">
          <img src={product.images[0]} alt={product.title} className="h-24 w-24 flex-none rounded-lg object-cover" />
          <div className="flex flex-1 flex-col">
            <h2 className="font-black">{product.title}</h2>
            <span className="mt-1 text-sm text-primary">{product.price} ر.س × {qty}</span>
            <span className="mt-auto text-lg font-black">الإجمالي: <span className="text-primary">{total.toFixed(2)} ر.س</span></span>
          </div>
        </div>

        {step === "confirm" && (
          <div className="rounded-2xl border border-border/50 bg-card p-5 md:p-7">
            <h3 className="mb-4 text-lg font-black"><span className="text-primary">●</span> تأكيد الشراء</h3>
            <label className="mb-1.5 block text-sm font-bold">الكمية</label>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-10 w-10 rounded-lg bg-secondary font-bold hover:bg-primary/20">−</button>
              <input type="number" min={1} max={product.quantity} value={qty}
                onChange={(e) => setQty(Math.min(product.quantity, Math.max(1, parseInt(e.target.value || "1", 10))))}
                className="h-10 w-20 rounded-lg border border-border/60 bg-secondary/40 text-center font-bold outline-none focus:border-primary" />
              <button type="button" onClick={() => setQty((q) => Math.min(product.quantity, q + 1))} className="h-10 w-10 rounded-lg bg-secondary font-bold hover:bg-primary/20">+</button>
              <span className="text-xs text-muted-foreground">المتاح: {product.quantity}</span>
            </div>
            <button onClick={() => setStep("payment")} className="mt-6 w-full rounded-xl bg-primary py-3.5 text-base font-black text-primary-foreground shadow-lg shadow-primary/30 hover:opacity-95">
              تأكيد الشراء والمتابعة للدفع
            </button>
          </div>
        )}

        {step === "payment" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-primary/30 bg-card p-5 md:p-7">
              <div className="mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-black">معلومات التحويل البنكي</h3>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">{BANK_INFO.note}</p>
              <div className="space-y-3 text-sm">
                <BankRow label="اسم البنك" value={BANK_INFO.bankName} />
                <BankRow label="اسم المستفيد" value={BANK_INFO.accountName} />
                <BankRow label="رقم الآيبان" value={BANK_INFO.iban} mono onCopy={() => copy(BANK_INFO.iban, "الآيبان")} />
                <BankRow label="رقم الحساب" value={BANK_INFO.accountNumber} mono onCopy={() => copy(BANK_INFO.accountNumber, "رقم الحساب")} />
              </div>
              <div className="mt-5 flex items-center gap-2 border-t border-border/30 pt-4">
                <Wallet className="h-5 w-5 text-primary" />
                <h4 className="font-black">أو الدفع عبر المحفظة</h4>
              </div>
              <div className="mt-3 space-y-3 text-sm">
                <BankRow label={BANK_INFO.wallet.name} value={BANK_INFO.wallet.number} mono onCopy={() => copy(BANK_INFO.wallet.number, "رقم المحفظة")} />
                <div className="rounded-lg bg-primary/10 p-3 text-center font-black text-primary">
                  المبلغ المطلوب تحويله: {total.toFixed(2)} ر.س
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-200">
              <ShieldCheck className="mt-0.5 h-5 w-5 flex-none" />
              <p>بعد الضغط على الزر سيتم إنشاء الطلب والانتقال لرفع صورة الإيصال.</p>
            </div>

            <button onClick={createOrder} disabled={creating} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-base font-black text-primary-foreground shadow-lg shadow-primary/30 hover:opacity-95 disabled:opacity-60">
              {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
              لقد قمت بالتحويل — رفع الإيصال
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function BankRow({ label, value, mono, onCopy }: { label: string; value: string; mono?: boolean; onCopy?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-secondary/40 px-3 py-2.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`font-bold ${mono ? "font-mono text-xs" : ""}`} dir={mono ? "ltr" : undefined}>{value}</span>
        {onCopy && <button type="button" onClick={onCopy} className="rounded p-1 text-primary hover:bg-primary/10"><Copy className="h-3.5 w-3.5" /></button>}
      </div>
    </div>
  );
}
