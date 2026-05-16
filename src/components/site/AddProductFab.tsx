import { Plus } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export function AddProductFab() {
  const { user, isSeller, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return null;

  function handleClick() {
    if (!user) {
      toast.info("سجّل دخولك أولاً لإضافة منتج");
      navigate({ to: "/login" });
      return;
    }
    if (!isSeller) {
      toast.error("فقط حسابات البائعين يمكنها إضافة منتجات");
      return;
    }
    navigate({ to: "/sell/new" });
  }

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 start-6 z-50 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-bold text-primary-foreground shadow-2xl shadow-primary/30 ring-2 ring-primary/30 transition hover:scale-105 hover:opacity-95"
    >
      <Plus className="h-5 w-5" />
      إضافة منتج
    </button>
  );
}
