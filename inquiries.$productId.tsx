import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, MessageCircle, ArrowRight } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/inquiries/$productId")({
  component: ProductInquiriesPage,
});

type Thread = {
  buyer_id: string;
  buyer_name: string;
  last: string;
  last_at: string;
  unread: number;
};

function ProductInquiriesPage() {
  const { productId } = Route.useParams();
  const { user, isSeller, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [productTitle, setProductTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !isSeller) { navigate({ to: "/" }); return; }
    (async () => {
      setLoading(true);
      const { data: p } = await supabase.from("products").select("title, seller_id").eq("id", productId).maybeSingle();
      if (!p || p.seller_id !== user.id) { navigate({ to: "/inquiries" }); return; }
      setProductTitle(p.title);
      const { data: msgs } = await supabase
        .from("messages")
        .select("buyer_id, sender_id, read_at, message, created_at")
        .eq("product_id", productId)
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });
      const buyerMap = new Map<string, Thread>();
      (msgs ?? []).forEach((m: any) => {
        if (!buyerMap.has(m.buyer_id)) {
          buyerMap.set(m.buyer_id, {
            buyer_id: m.buyer_id, buyer_name: "مشتري",
            last: m.message, last_at: m.created_at, unread: 0,
          });
        }
        if (m.sender_id !== user.id && !m.read_at) buyerMap.get(m.buyer_id)!.unread += 1;
      });
      const ids = Array.from(buyerMap.keys());
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("id, username").in("id", ids);
        (profs ?? []).forEach((pr: any) => {
          const t = buyerMap.get(pr.id); if (t) t.buyer_name = pr.username;
        });
      }
      setThreads(Array.from(buyerMap.values()));
      setLoading(false);
    })();
  }, [productId, user, isSeller, authLoading]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-6 md:py-10">
        <Link to="/inquiries" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowRight className="h-4 w-4" /> الاستفسارات
        </Link>
        <h1 className="mb-5 text-xl font-black">استفسارات: {productTitle}</h1>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> جاري التحميل...</div>
        ) : threads.length === 0 ? (
          <div className="rounded-xl border border-border/50 bg-card p-10 text-center text-muted-foreground">لا توجد استفسارات.</div>
        ) : (
          <div className="space-y-2">
            {threads.map((t) => (
              <Link
                key={t.buyer_id}
                to="/chat/$productId/$buyerId"
                params={{ productId, buyerId: t.buyer_id }}
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-3 hover:border-primary/40"
              >
                <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/15 text-primary"><MessageCircle className="h-5 w-5" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate text-sm font-bold">{t.buyer_name}</h3>
                    <span className="text-[10px] text-muted-foreground" dir="ltr">{new Date(t.last_at).toLocaleDateString("ar-EG")}</span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{t.last}</p>
                </div>
                {t.unread > 0 && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-black text-primary-foreground">{t.unread}</span>
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
