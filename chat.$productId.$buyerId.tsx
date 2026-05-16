import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Send, Loader2, Package } from "lucide-react";
import { Header } from "@/components/site/Header";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import type { Message } from "@/lib/messages";

export const Route = createFileRoute("/chat/$productId/$buyerId")({
  component: ChatPage,
});

type Product = {
  id: string;
  seller_id: string;
  title: string;
  price: number;
  images: string[];
};

function ChatPage() {
  const { productId, buyerId } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [buyerName, setBuyerName] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: p } = await supabase
        .from("products")
        .select("id, seller_id, title, price, images")
        .eq("id", productId)
        .maybeSingle();
      if (cancelled) return;
      if (!p) {
        toast.error("المنتج غير موجود");
        setLoading(false);
        return;
      }
      setProduct(p as Product);

      // Access control: only buyer or seller of this thread
      if (user.id !== buyerId && user.id !== p.seller_id) {
        toast.error("لا تملك صلاحية لعرض هذه المحادثة");
        navigate({ to: "/" });
        return;
      }

      const { data: profs } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", [buyerId, p.seller_id]);
      if (profs) {
        setBuyerName(profs.find((x) => x.id === buyerId)?.username ?? "مشتري");
        setSellerName(profs.find((x) => x.id === p.seller_id)?.username ?? "بائع");
      }

      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("product_id", productId)
        .eq("buyer_id", buyerId)
        .order("created_at", { ascending: true });
      if (!cancelled) {
        setMessages((msgs ?? []) as Message[]);
        setLoading(false);
        markRead(msgs as Message[] | null);
      }
    })();

    return () => { cancelled = true; };
  }, [productId, buyerId, user, authLoading]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`chat-${productId}-${buyerId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `product_id=eq.${productId}` },
        (payload) => {
          const m = payload.new as Message;
          if (m.buyer_id !== buyerId) return;
          setMessages((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m]);
          if (m.sender_id !== user.id) {
            supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("id", m.id);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [productId, buyerId, user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  async function markRead(msgs: Message[] | null) {
    if (!user || !msgs) return;
    const unread = msgs.filter((m) => m.sender_id !== user.id && !m.read_at).map((m) => m.id);
    if (unread.length) {
      await supabase.from("messages").update({ read_at: new Date().toISOString() }).in("id", unread);
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !product || !text.trim()) return;
    setSending(true);
    const payload = {
      product_id: product.id,
      buyer_id: buyerId,
      seller_id: product.seller_id,
      sender_id: user.id,
      message: text.trim(),
    };
    const { error } = await supabase.from("messages").insert(payload);
    setSending(false);
    if (error) {
      toast.error("تعذر إرسال الرسالة");
      return;
    }
    setText("");
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex min-h-[50vh] items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> جاري التحميل...
        </div>
      </div>
    );
  }
  if (!product) return null;

  const isSeller = user?.id === product.seller_id;
  const otherName = isSeller ? buyerName : sellerName;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto flex max-w-3xl flex-col px-3 py-4 md:py-6" style={{ minHeight: "calc(100vh - 80px)" }}>
        {/* Product header */}
        <Link
          to="/products/$id"
          params={{ id: product.id }}
          className="mb-3 flex items-center gap-3 rounded-xl border border-border/50 bg-card p-3 hover:border-primary/40"
        >
          <img src={product.images?.[0]} alt={product.title} className="h-14 w-14 rounded-lg object-cover" />
          <div className="flex-1 min-w-0">
            <h2 className="truncate text-sm font-bold">{product.title}</h2>
            <p className="text-xs text-primary font-black">{product.price} ر.س</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </Link>

        <div className="mb-2 rounded-lg bg-secondary/40 px-3 py-2 text-xs">
          <span className="text-muted-foreground">المحادثة مع: </span>
          <span className="font-bold">{otherName}</span>
          <span className="ms-2 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
            {isSeller ? "مشتري" : "بائع"}
          </span>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto rounded-xl border border-border/50 bg-card p-3 space-y-2"
          style={{ maxHeight: "60vh", minHeight: "300px" }}
        >
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
              <Package className="h-10 w-10 opacity-50" />
              <p className="text-sm">{isSeller ? "لا توجد استفسارات بعد" : "ابدأ المحادثة بإرسال أول استفسار"}</p>
            </div>
          ) : (
            messages.map((m) => {
              const mine = m.sender_id === user!.id;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                      mine
                        ? "bg-primary text-primary-foreground rounded-bl-md"
                        : "bg-secondary text-foreground rounded-br-md"
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{m.message}</p>
                    <p className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`} dir="ltr">
                      {new Date(m.created_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Composer */}
        <form onSubmit={send} className="mt-3 flex items-center gap-2 rounded-xl border border-border/50 bg-card p-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isSeller ? "اكتب ردك..." : "اكتب استفسارك..."}
            maxLength={2000}
            className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            إرسال
          </button>
        </form>
      </main>
    </div>
  );
}
