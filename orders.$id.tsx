import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Truck, PackageCheck, XCircle, Receipt } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { PAYMENT_STATUS_LABELS, SHIPPING_STATUS_LABELS } from "@/lib/orders";

type OrderUpdate = Database["public"]["Tables"]["orders"]["Update"];

export const Route = createFileRoute("/orders/$id")({
  component: OrderDetailPage,
});

type Order = {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string;
  quantity: number;
  total_price: number;
  receipt_image: string | null;
  notes: string | null;
  payment_status: string;
  shipping_status: string;
  completed_at: string | null;
  created_at: string;
  products?: { title: string; images: string[] };
};

function OrderDetailPage() {
  const { id } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [buyerName, setBuyerName] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [receiptUrl, setReceiptUrl] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*, products(title, images)")
      .eq("id", id).maybeSingle();
    if (error || !data) { toast.error("الطلب غير موجود"); navigate({ to: "/" }); return; }
    setOrder(data as Order);

    const [b, s, r] = await Promise.all([
      supabase.from("profiles").select("username").eq("id", data.buyer_id).maybeSingle(),
      supabase.from("profiles").select("username").eq("id", data.seller_id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle(),
    ]);
    setBuyerName(b.data?.username ?? "مشتري");
    setSellerName(s.data?.username ?? "بائع");
    setIsAdmin(!!r.data);

    if (data.receipt_image) {
      const { data: signed } = await supabase.storage.from("receipts").createSignedUrl(data.receipt_image, 60 * 60);
      if (signed?.signedUrl) setReceiptUrl(signed.signedUrl);
    }
    setLoading(false);
  }, [id, user, navigate]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    load();
  }, [user, authLoading, navigate, load]);

  async function update(patch: OrderUpdate, successMsg: string) {
    if (!order) return;
    setActionLoading(true);
    const { error } = await supabase.from("orders").update(patch).eq("id", order.id);
    setActionLoading(false);
    if (error) { toast.error("فشل التحديث: " + error.message); return; }
    toast.success(successMsg);
    load();
  }

  if (loading || !order || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex min-h-[50vh] items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> جاري التحميل...
        </div>
      </div>
    );
  }

  const isBuyer = user.id === order.buyer_id;
  const isSeller = user.id === order.seller_id;
  const pStatus = PAYMENT_STATUS_LABELS[order.payment_status];
  const sStatus = SHIPPING_STATUS_LABELS[order.shipping_status];
  const product = order.products;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <nav className="mb-3 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">الرئيسية</Link>
          <span className="mx-2">/</span>
          <Link to="/orders" className="hover:text-primary">طلباتي</Link>
          <span className="mx-2">/</span>
          <span>#{order.id.slice(0, 8)}</span>
        </nav>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-black md:text-3xl">
            <span className="text-primary">●</span> طلب #{order.id.slice(0, 8)}
          </h1>
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <span className={`rounded-full px-3 py-1 ${pStatus.color}`}>{pStatus.label}</span>
            <span className={`rounded-full px-3 py-1 ${sStatus.color}`}>{sStatus.label}</span>
          </div>
        </div>

        {/* Product card */}
        {product && (
          <Link to="/products/$id" params={{ id: order.product_id }} className="mb-5 flex gap-4 rounded-2xl border border-border/50 bg-card p-4 transition hover:border-primary/40">
            <img src={product.images[0]} alt={product.title} className="h-24 w-24 flex-none rounded-lg object-cover" />
            <div className="flex flex-1 flex-col">
              <h2 className="font-black">{product.title}</h2>
              <span className="mt-1 text-sm text-muted-foreground">الكمية: {order.quantity}</span>
              <span className="mt-auto text-lg font-black text-primary">{order.total_price} ر.س</span>
            </div>
          </Link>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          {/* Info */}
          <div className="rounded-2xl border border-border/50 bg-card p-5">
            <h3 className="mb-3 font-black">تفاصيل الطلب</h3>
            <div className="space-y-2 text-sm">
              <Row label="المشتري" value={buyerName} />
              <Row label="البائع" value={sellerName} />
              <Row label="تاريخ الطلب" value={new Date(order.created_at).toLocaleString("ar-EG")} />
              {order.completed_at && <Row label="تاريخ الاكتمال" value={new Date(order.completed_at).toLocaleString("ar-EG")} />}
              {order.notes && <div className="border-t border-border/30 pt-2"><span className="text-xs text-muted-foreground">ملاحظات: </span>{order.notes}</div>}
            </div>
          </div>

          {/* Receipt */}
          <div className="rounded-2xl border border-border/50 bg-card p-5">
            <h3 className="mb-3 flex items-center gap-2 font-black"><Receipt className="h-4 w-4 text-primary" /> إيصال الدفع</h3>
            {receiptUrl ? (
              <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg ring-1 ring-border hover:ring-primary">
                <img src={receiptUrl} alt="receipt" className="max-h-64 w-full object-contain" />
              </a>
            ) : (
              <div className="rounded-lg bg-secondary/40 p-4 text-center text-sm text-muted-foreground">
                لم يتم رفع الإيصال بعد
                {isBuyer && order.payment_status === "pending_payment" && (
                  <Link to="/orders/$id/pay" params={{ id: order.id }} className="mt-3 inline-block rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">رفع الإيصال</Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 rounded-2xl border border-primary/30 bg-card p-5">
          <h3 className="mb-3 font-black">الإجراءات المتاحة</h3>
          <div className="flex flex-wrap gap-2">
            {/* Admin: approve/reject payment */}
            {isAdmin && order.payment_status === "pending_payment_review" && (
              <>
                <button disabled={actionLoading} onClick={() => update({ payment_status: "approved" }, "تم اعتماد الدفع — سيُشحن المنتج")}
                  className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60">
                  <CheckCircle2 className="h-4 w-4" /> اعتماد الدفع
                </button>
                <button disabled={actionLoading} onClick={() => update({ payment_status: "rejected" }, "تم رفض الدفع")}
                  className="flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60">
                  <XCircle className="h-4 w-4" /> رفض الدفع
                </button>
              </>
            )}

            {/* Seller: mark shipped */}
            {isSeller && order.payment_status === "approved" && order.shipping_status === "not_shipped" && (
              <button disabled={actionLoading} onClick={() => update({ shipping_status: "shipped" }, "تم تأكيد الشحن")}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60">
                <Truck className="h-4 w-4" /> تم الشحن
              </button>
            )}

            {/* Buyer: mark received */}
            {isBuyer && order.shipping_status === "shipped" && (
              <button disabled={actionLoading} onClick={() => update({ shipping_status: "delivered", completed_at: new Date().toISOString() as any }, "تم تأكيد الاستلام — اكتمل الطلب 🎉")}
                className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60">
                <PackageCheck className="h-4 w-4" /> تم الاستلام
              </button>
            )}

            {order.shipping_status === "delivered" && (
              <span className="rounded-lg bg-emerald-500/10 px-4 py-2.5 text-sm font-bold text-emerald-300">✓ الطلب مكتمل</span>
            )}

            {/* Status hints */}
            {isBuyer && order.payment_status === "pending_payment" && (
              <Link to="/orders/$id/pay" params={{ id: order.id }} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90">
                رفع إيصال الدفع
              </Link>
            )}
            {isSeller && order.payment_status === "pending_payment_review" && (
              <span className="text-sm text-muted-foreground">بانتظار مراجعة الإدارة للإيصال</span>
            )}
            {isSeller && order.payment_status === "approved" && order.shipping_status === "shipped" && (
              <span className="text-sm text-muted-foreground">تم شحن المنتج — بانتظار تأكيد الاستلام</span>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/30 pb-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
