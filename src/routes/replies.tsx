import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Inbox } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/replies")({
  component: RepliesPage,
});

type Thread = {
  product_id: string;
  title: string;
  image: string;
  seller_name: string;
  last: string;
  last_at: string;
  unread: number;
};

function RepliesPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    (async () => {
      setLoading(true);
      const { data: msgs } = await supabase
        .from("messages")
        .select("product_id, sender_id, read_at, message, created_at, seller_id")
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false });
      const map = new Map<string, Thread>();
      (msgs ?? []).forEach((m: any) => {
        if (!map.has(m.product_id)) {
          map.set(m.product_id, {
            product_id: m.product_id, title: "", image: "", seller_name: "بائع",
            last: m.message, last_at: m.created_at, unread: 0,
          });
        }
        if (m.sender_id !== user.id && !m.read_at) map.get(m.product_id)!.unread += 1;
      });
      const pids = Array.from(map.keys());
      if (pids.length) {
        const { data: products } = await supabase.from("products").select("id, title, images, seller_id").in("id", pids);
        const sellerIds = new Set<string>();
        (products ?? []).forEach((p: any) => {
          const t = map.get(p.id); if (!t) return;
          t.title = p.title; t.image = p.images?.[0] ?? "";
          sellerIds.add(p.seller_id);
          (t as any)._sid = p.seller_id;
        });
        const { data: profs } = await supabase.from("profiles").select("id, username").in("id", Array.from(sellerIds));
        const pmap = new Map((profs ?? []).map((p: any) => [p.id, p.username]));
        map.forEach((t) => { t.seller_name = pmap.get((t as any)._sid) ?? "بائع"; });
      }
      setThreads(Array.from(map.values()));
      setLoading(false);
    })();
  }, [user, authLoading]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-6 md:py-10">
        <h1 className="mb-5 flex items-center gap-2 text-2xl font-black"><Inbox className="text-primary" /> الردود</h1>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> جاري التحميل...</div>
        ) : threads.length === 0 ? (
          <div className="rounded-xl border border-border/50 bg-card p-10 text-center text-muted-foreground">لم ترسل أي استفسارات بعد.</div>
        ) : (
          <div className="space-y-2">
            {threads.map((t) => (
              <Link
                key={t.product_id}
                to="/chat/$productId/$buyerId"
                params={{ productId: t.product_id, buyerId: user!.id }}
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-3 hover:border-primary/40"
              >
                <img src={t.image} alt={t.title} className="h-14 w-14 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate text-sm font-bold">{t.title}</h3>
                    <span className="text-[10px] text-muted-foreground" dir="ltr">{new Date(t.last_at).toLocaleDateString("ar-EG")}</span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{t.last}</p>
                  <p className="text-[10px] text-muted-foreground">البائع: {t.seller_name}</p>
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
