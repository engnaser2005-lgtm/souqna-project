import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageSquare, Inbox } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export function MessagesNavButton() {
  const { user, isSeller, profile } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user || !profile) return;
    let cancelled = false;
    async function load() {
      const col = isSeller ? "seller_id" : "buyer_id";
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq(col, user!.id)
        .neq("sender_id", user!.id)
        .is("read_at", null);
      if (!cancelled) setUnread(count ?? 0);
    }
    load();
    const ch = supabase
      .channel(`unread-${user.id}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => load()
      ).subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [user, profile, isSeller]);

  if (!user || !profile) return null;

  const to = isSeller ? "/inquiries" : "/replies";
  const label = isSeller ? "الاستفسارات" : "الردود";
  const Icon = isSeller ? MessageSquare : Inbox;

  return (
    <Link
      to={to}
      className="relative inline-flex items-center gap-1.5 rounded-md border border-primary/40 px-3 py-2 text-sm font-semibold text-foreground hover:bg-primary/10"
    >
      <Icon className="h-4 w-4" />
      <span className="hidden md:inline">{label}</span>
      {unread > 0 && (
        <span className="absolute -top-1.5 -start-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-black text-primary-foreground">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}
