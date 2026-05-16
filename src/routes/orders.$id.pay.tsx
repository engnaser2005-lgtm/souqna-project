import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";
import { toast } from "sonner";
import { Loader2, Upload, ImagePlus, X } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/orders/$id/pay")({
  component: PayPage,
});

type Order = {
  id: string; buyer_id: string; total_price: number;
  payment_status: string; product_id: string;
};

function PayPage() {
  const { id } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [productTitle, setProductTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    (async () => {
      const { data, error } = await supabase
        .from("orders").select("id, buyer_id, total_price, payment_status, product_id, products(title)")
        .eq("id", id).maybeSingle();
      if (error || !data) { toast.error("الطلب غير موجود"); navigate({ to: "/" }); return; }
      if (data.buyer_id !== user.id) { toast.error("لا تملك صلاحية على هذا الطلب"); navigate({ to: "/" }); return; }
      setOrder(data as any);
      setProductTitle((data as any).products?.title ?? "");
      setLoading(false);
    })();
  }, [id, user, authLoading, navigate]);

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) { toast.error("يجب أن يكون الملف صورة"); return; }
    if (f.size > 5 * 1024 * 1024) { toast.error("الحجم أكبر من 5 ميجا"); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file || !user || !order) { toast.error("اختر صورة الإيصال"); return; }
    setSubmitting(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${order.id}-${Date.now()}.${ext}`;
      const up = await supabase.storage.from("receipts").upload(path, file, { cacheControl: "3600", upsert: false });
      if (up.error) throw up.error;
      const { error } = await supabase.from("orders").update({
        receipt_image: path,
        notes: notes.trim() || null,
        payment_status: "pending_payment_review",
      }).eq("id", order.id);
      if (error) throw error;
      toast.success("تم إرسال الإيصال للمراجعة 🎉");
      navigate({ to: "/orders/$id", params: { id: order.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل رفع الإيصال");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex min-h-[50vh] items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> جاري التحميل...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <nav className="mb-3 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">الرئيسية</Link>
          <span className="mx-2">/</span>
          <Link to="/orders" className="hover:text-primary">طلباتي</Link>
          <span className="mx-2">/</span>
          <span>رفع الإيصال</span>
        </nav>

        <h1 className="mb-1 text-2xl font-black md:text-3xl"><span className="text-primary">●</span> رفع إيصال الدفع</h1>
        <p className="mb-5 text-sm text-muted-foreground">{productTitle} — المبلغ: <span className="font-bold text-primary">{order.total_price} ر.س</span></p>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-border/50 bg-card p-5 md:p-7">
          <div>
            <label className="mb-1.5 block text-sm font-bold">صورة الإيصال *</label>
            {preview ? (
              <div className="relative inline-block">
                <img src={preview} alt="preview" className="max-h-64 rounded-lg ring-1 ring-border" />
                <button type="button" onClick={() => { setFile(null); setPreview(""); }} className="absolute top-2 end-2 rounded-full bg-black/70 p-1.5 text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex h-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 bg-secondary/30 text-primary transition hover:bg-secondary/60">
                <ImagePlus className="h-8 w-8" />
                <span className="text-sm font-bold">اضغط لاختيار صورة الإيصال</span>
                <span className="text-xs text-muted-foreground">حتى 5 ميجا</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
              </label>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold">ملاحظات (اختياري)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500}
              placeholder="عنوان الشحن، رقم العملية، أي تفاصيل..."
              className="min-h-[100px] w-full resize-y rounded-lg border border-border/60 bg-secondary/40 px-3 py-2.5 text-sm outline-none focus:border-primary focus:bg-secondary" />
          </div>

          <button type="submit" disabled={submitting || !file}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-base font-black text-primary-foreground shadow-lg shadow-primary/30 hover:opacity-95 disabled:opacity-60">
            {submitting ? <><Loader2 className="h-5 w-5 animate-spin" /> جاري الإرسال...</> : <><Upload className="h-5 w-5" /> إرسال الإيصال للمراجعة</>}
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
