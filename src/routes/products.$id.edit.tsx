import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ProductForm } from "@/components/site/ProductForm";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/products/$id/edit")({
  component: EditProductPage,
});

function EditProductPage() {
  const { id } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [initial, setInitial] = useState<any>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error || !data) {
        toast.error("لم يتم العثور على المنتج");
        navigate({ to: "/" });
        return;
      }
      if (data.seller_id !== user.id) {
        toast.error("لا تملك صلاحية تعديل هذا المنتج");
        navigate({ to: "/products/$id", params: { id } });
        return;
      }
      setInitial({
        title: data.title,
        price: String(data.price),
        description: data.description,
        category: data.category,
        quantity: String(data.quantity),
        condition: data.condition,
        city: data.city,
        contact_number: data.contact_number,
        images: data.images,
      });
      setLoading(false);
    })();
  }, [id, user, authLoading, navigate]);

  if (authLoading || loading || !user || !initial) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex min-h-[50vh] items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> جاري التحميل...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <nav className="mb-2 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-primary">الرئيسية</Link>
            <span className="mx-2">/</span>
            <Link to="/products/$id" params={{ id }} className="hover:text-primary">المنتج</Link>
            <span className="mx-2">/</span>
            <span>تعديل</span>
          </nav>
          <h1 className="text-2xl font-black md:text-3xl">
            <span className="text-primary">●</span> تعديل المنتج
          </h1>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-xl md:p-7">
          <ProductForm
            userId={user.id}
            initial={initial}
            submitLabel="حفظ التعديلات"
            onSubmit={async (values) => {
              const { error } = await supabase
                .from("products")
                .update(values)
                .eq("id", id);
              if (error) throw error;
              toast.success("تم تحديث المنتج بنجاح");
              navigate({ to: "/products/$id", params: { id } });
            }}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
