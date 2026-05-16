import { Star, ShoppingCart, MessageCircle } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import type { Product } from "@/lib/catalog";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= Math.round(rating) ? "fill-primary text-primary" : "text-muted-foreground/40"}`}
        />
      ))}
      <span className="ms-1 text-xs text-muted-foreground">{rating.toFixed(1)}</span>
    </div>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  function handleInquiry() {
    if (!user) {
      toast.error("سجّل دخولك أولاً لإرسال استفسار");
      navigate({ to: "/login" });
      return;
    }
    toast.info("افتح المنتج من سوق المنتجات الحقيقية للتواصل مع البائع");
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-border/50 transition hover:-translate-y-1 hover:shadow-xl hover:ring-primary/40">
      <div className="relative aspect-square overflow-hidden bg-secondary">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        {discount > 0 && (
          <span className="absolute top-2 start-2 rounded-md bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
            -{discount}%
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-tight">
          {product.name}
        </h3>
        <Stars rating={product.rating} />
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-primary">{product.price} ر.س</span>
          {product.oldPrice && (
            <span className="text-xs text-muted-foreground line-through">{product.oldPrice}</span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">({product.reviews.toLocaleString("ar-EG")} تقييم)</p>
        <div className="mt-auto grid grid-cols-2 gap-1.5 pt-2">
          <button className="inline-flex items-center justify-center gap-1 rounded-md bg-primary px-2 py-2 text-xs font-bold text-primary-foreground transition hover:opacity-90">
            <ShoppingCart className="h-3.5 w-3.5" />
            شراء
          </button>
          <button onClick={handleInquiry} className="inline-flex items-center justify-center gap-1 rounded-md border border-primary/40 bg-secondary px-2 py-2 text-xs font-bold text-foreground transition hover:bg-primary/10">
            <MessageCircle className="h-3.5 w-3.5" />
            استعلام
          </button>
        </div>
      </div>
    </article>
  );
}
