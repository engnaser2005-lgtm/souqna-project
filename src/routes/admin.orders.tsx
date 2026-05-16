import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { PAYMENT_STATUS_LABELS } from "@/lib/orders";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrdersPage,
});

function AdminOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("pending_payment_review");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    (async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      setIsAdmin(!!data);
    })();
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      setLoading(true);
      let q = supabase.from("orders")
        .select("id, total_price, payment_status, shipping_status, created_at, products(title, images), profiles!orders_seller_id_fkey(username)")
        .order("created_at", { ascending: false });
      if (filter !== "all") q = q.eq("payment_status", filter as any);
      const { data } = await q;
      setOrders(data ?? []);
      setLoading(false);
    })();
  }, [isAdmin, filter]);

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex min-h-[50vh] items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> جاري التحميل...
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-md px-4 py-20 text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-4 text-2xl font-black">غير مسموح</h1>
          <p className="mt-2 text-sm text-muted-foreground">هذه الصفحة للإدارة فقط</p>
          <Link to="/" className="mt-4 inline-block rounded-md bg-primary px-4 py-2 font-bold text-primary-foreground">العودة</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-5 text-2xl font-black md:text-3xl"><span className="text-primary">●</span> لوحة الإدارة — الطلبات</h1>

        <div className="mb-5 flex flex-wrap gap-2">
          {[
            { v: "pending_payment_review", l: "قيد المراجعة" },
            { v: "approved", l: "مقبولة" },
            { v: "rejected", l: "مرفوضة" },
            { v: "pending_payment", l: "بانتظار الدفع" },
            { v: "all", l: "الكل" },
          ].map((f) => (
            <button key={f.v} onClick={() => setFilter(f.v)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${filter === f.v ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground ring-1 ring-border hover:text-foreground"}`}>
              {f.l}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-border/50 bg-card p-10 text-center text-muted-foreground">لا توجد طلبات</div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => {
              const p = PAYMENT_STATUS_LABELS[o.payment_status];
              return (
                <Link key={o.id} to="/orders/$id" params={{ id: o.id }}
                  className="flex items-center gap-4 rounded-2xl border border-border/50 bg-card p-3 hover:border-primary/40">
                  <img src={o.products?.images[0]} alt="" className="h-16 w-16 flex-none rounded-lg object-cover" />
                  <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                    <h3 className="truncate font-bold">{o.products?.title}</h3>
                    <span className="text-xs text-muted-foreground">البائع: {o.profiles?.username} · #{o.id.slice(0, 8)}</span>
                    <span className={`mt-1 inline-block w-fit rounded-full px-2 py-0.5 text-[10px] font-bold ${p.color}`}>{p.label}</span>
                  </div>
                  <span className="flex-none text-lg font-black text-primary">{o.total_price} ر.س</span>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
