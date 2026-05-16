import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Edit, MapPin, Package, Phone, Loader2, Trash2, ShoppingBag, MessageCircle } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES } from "@/lib/catalog";

export const Route = createFileRoute("/products/$id")({
  component: ProductDetailPage,
});

type Product = {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  quantity: number;
  condition: string;
  city: string;
  contact_number: string;
  created_at: string;
};

const CONDITION_LABELS: Record<string, string> = {
  new: "جديد",
  like_new: "كالجديد",
  used: "مستعمل",
  refurbished: "مجدد",
};

function ProductDetailPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [sellerName, setSellerName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        toast.error("لم يتم العثور على المنتج");
        setLoading(false);
        return;
      }
      setProduct(data as Product);
      const { data: prof } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", data.seller_id)
        .maybeSingle();
      if (!cancelled) setSellerName(prof?.username ?? "بائع");
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id]);

  async function handleDelete() {
    if (!product) return;
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
    setDeleting(true);
    const { error } = await supabase.from("products").delete().eq("id", product.id);
    setDeleting(false);
    if (error) {
      toast.error("فشل الحذف");
      return;
    }
    toast.success("تم حذف المنتج");
    navigate({ to: "/" });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex min-h-[50vh] items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> جاري التحميل...
        </div>
      </div>
    );
  }
  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <h1 className="text-2xl font-black">المنتج غير موجود</h1>
          <Link to="/" className="mt-4 inline-block rounded-md bg-primary px-4 py-2 font-bold text-primary-foreground">العودة للرئيسية</Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === product.seller_id;
  const categoryName = CATEGORIES.find((c) => c.slug === product.category)?.name ?? product.category;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6 md:py-10">
        <nav className="mb-4 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">الرئيسية</Link>
          <span className="mx-2">/</span>
          <Link to="/category/$slug" params={{ slug: product.category }} className="hover:text-primary">{categoryName}</Link>
        </nav>

        <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
          {/* Gallery */}
          <div>
            <div className="aspect-square overflow-hidden rounded-2xl bg-card ring-1 ring-border/50">
              <img src={product.images[activeImg]} alt={product.title} className="h-full w-full object-cover" />
            </div>
            {product.images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`h-16 w-16 flex-none overflow-hidden rounded-lg ring-2 transition ${i === activeImg ? "ring-primary" : "ring-border/40 hover:ring-primary/50"}`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="rounded-2xl border border-border/50 bg-card p-5 md:p-6">
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              {categoryName}
            </span>
            <h1 className="mt-3 text-2xl font-black leading-tight md:text-3xl">{product.title}</h1>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-black text-primary">{product.price} ر.س</span>
            </div>

            <div className="mt-5 space-y-2.5 text-sm">
              <Row icon={<Package className="h-4 w-4" />} label="الحالة" value={CONDITION_LABELS[product.condition] ?? product.condition} />
              <Row icon={<Package className="h-4 w-4" />} label="الكمية المتوفرة" value={`${product.quantity}`} />
              <Row icon={<MapPin className="h-4 w-4" />} label="المدينة" value={product.city} />
              <Row icon={<Phone className="h-4 w-4" />} label="رقم التواصل" value={<a href={`tel:${product.contact_number}`} dir="ltr" className="text-primary hover:underline">{product.contact_number}</a>} />
            </div>

            <div className="mt-5 rounded-xl bg-secondary/40 p-3 text-sm">
              <span className="text-xs text-muted-foreground">البائع: </span>
              <span className="font-bold">{sellerName}</span>
            </div>

            {!isOwner && product.quantity > 0 && (
              <Link
                to="/products/$id/buy"
                params={{ id: product.id }}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-base font-black text-primary-foreground shadow-lg shadow-primary/30 hover:opacity-95"
              >
                <ShoppingBag className="h-5 w-5" /> تأكيد الشراء
              </Link>
            )}
            {!isOwner && product.quantity === 0 && (
              <div className="mt-5 rounded-xl border border-destructive/40 bg-destructive/10 py-3 text-center text-sm font-bold text-destructive">
                نفذت الكمية
              </div>
            )}
            {!isOwner && user && (
              <Link
                to="/chat/$productId/$buyerId"
                params={{ productId: product.id, buyerId: user.id }}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-primary/40 bg-secondary py-3 text-sm font-bold text-foreground hover:bg-primary/10"
              >
                <MessageCircle className="h-4 w-4" /> استعلام عن المنتج
              </Link>
            )}
            <a
              href={`tel:${product.contact_number}`}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-primary/40 bg-secondary py-3 text-sm font-bold text-foreground hover:bg-primary/10"
            >
              <Phone className="h-4 w-4" /> تواصل مع البائع
            </a>

            {isOwner && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link
                  to="/products/$id/edit"
                  params={{ id: product.id }}
                  className="flex items-center justify-center gap-2 rounded-lg border border-primary/40 bg-secondary px-3 py-2.5 text-sm font-bold text-foreground hover:bg-primary/10"
                >
                  <Edit className="h-4 w-4" /> تعديل المنتج
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center justify-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm font-bold text-destructive hover:bg-destructive/20 disabled:opacity-60"
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  حذف
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <section className="mt-8 rounded-2xl border border-border/50 bg-card p-5 md:p-7">
          <h2 className="mb-3 text-lg font-black"><span className="text-primary">●</span> وصف المنتج</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{product.description}</p>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/30 pb-2 last:border-0">
      <span className="flex items-center gap-2 text-muted-foreground">{icon} {label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
