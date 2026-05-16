import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ShoppingBag, Store } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { PAYMENT_STATUS_LABELS, SHIPPING_STATUS_LABELS } from "@/lib/orders";

export const Route = createFileRoute("/orders/")({
  component: OrdersPage,
});

type OrderRow = {
  id: string; buyer_id: string; seller_id: string;
  total_price: number; quantity: number;
  payment_status: string; shipping_status: string; created_at: string;
  products: { title: string; images: string[] } | null;
};

function OrdersPage() {
  const { user, isSeller, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"buying" | "selling">("buying");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    (async () => {
      setLoading(true);
      const col = tab === "buying" ? "buyer_id" : "seller_id";
      const { data } = await supabase.from("orders")
        .select("id, buyer_id, seller_id, total_price, quantity, payment_status, shipping_status, created_at, products(title, images)")
        .eq(col, user.id)
        .order("created_at", { ascending: false });
      setOrders((data as any) ?? []);
      setLoading(false);
    })();
  }, [user, tab, authLoading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-5 text-2xl font-black md:text-3xl"><span className="text-primary">●</span> طلباتي</h1>

        <div className="mb-5 inline-flex rounded-xl bg-card p-1 ring-1 ring-border">
          <button onClick={() => setTab("buying")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition ${tab === "buying" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            <ShoppingBag className="h-4 w-4" /> مشترياتي
          </button>
          {isSeller && (
            <button onClick={() => setTab("selling")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition ${tab === "selling" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <Store className="h-4 w-4" /> مبيعاتي
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-border/50 bg-card p-10 text-center text-muted-foreground">لا توجد طلبات بعد</div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => {
              const p = PAYMENT_STATUS_LABELS[o.payment_status];
              const s = SHIPPING_STATUS_LABELS[o.shipping_status];
              return (
                <Link key={o.id} to="/orders/$id" params={{ id: o.id }}
                  className="flex items-center gap-4 rounded-2xl border border-border/50 bg-card p-3 transition hover:border-primary/40 hover:shadow-lg">
                  <img src={o.products?.images[0]} alt="" className="h-20 w-20 flex-none rounded-lg object-cover" />
                  <div className="flex flex-1 flex-col gap-1 min-w-0">
                    <h3 className="truncate font-bold">{o.products?.title ?? "—"}</h3>
                    <span className="text-xs text-muted-foreground">#{o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleDateString("ar-EG")}</span>
                    <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                      <span className={`rounded-full px-2 py-0.5 ${p.color}`}>{p.label}</span>
                      <span className={`rounded-full px-2 py-0.5 ${s.color}`}>{s.label}</span>
                    </div>
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
