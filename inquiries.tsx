import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageSquare, Loader2, Package } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/inquiries")({
  component: InquiriesPage,
});

type Row = {
  product_id: string;
  title: string;
  image: string;
  total: number;
  unread: number;
};

function InquiriesPage() {
  const { user, isSeller, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    if (!isSeller) { navigate({ to: "/" }); return; }
    (async () => {
      setLoading(true);
      const { data: msgs } = await supabase
        .from("messages")
        .select("product_id, sender_id, read_at, buyer_id")
        .eq("seller_id", user.id);
      const grouped = new Map<string, { total: Set<string>; unread: number }>();
      (msgs ?? []).forEach((m: any) => {
        if (!grouped.has(m.product_id)) grouped.set(m.product_id, { total: new Set(), unread: 0 });
        const g = grouped.get(m.product_id)!;
        g.total.add(m.buyer_id);
        if (m.sender_id !== user.id && !m.read_at) g.unread += 1;
      });
      const pids = Array.from(grouped.keys());
      if (pids.length === 0) { setRows([]); setLoading(false); return; }
      const { data: products } = await supabase
        .from("products")
        .select("id, title, images")
        .in("id", pids);
      const result: Row[] = (products ?? []).map((p: any) => ({
        product_id: p.id,
        title: p.title,
        image: p.images?.[0] ?? "",
        total: grouped.get(p.id)!.total.size,
        unread: grouped.get(p.id)!.unread,
      })).sort((a, b) => b.unread - a.unread);
      setRows(result);
      setLoading(false);
    })();
  }, [user, isSeller, authLoading]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-6 md:py-10">
        <h1 className="mb-5 flex items-center gap-2 text-2xl font-black"><MessageSquare className="text-primary" /> الاستفسارات</h1>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> جاري التحميل...</div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-border/50 bg-card p-10 text-center text-muted-foreground">
            <Package className="mx-auto mb-3 h-10 w-10 opacity-50" />
            لا توجد استفسارات على منتجاتك حتى الآن.
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <Link
                key={r.product_id}
                to="/inquiries/$productId"
                params={{ productId: r.product_id }}
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-3 hover:border-primary/40"
              >
                <img src={r.image} alt={r.title} className="h-14 w-14 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <h3 className="truncate text-sm font-bold">{r.title}</h3>
                  <p className="text-xs text-muted-foreground">{r.total} مشتري استفسروا</p>
                </div>
                {r.unread > 0 && (
                  <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-black text-primary-foreground">{r.unread}</span>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
