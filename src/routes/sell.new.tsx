import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ProductForm } from "@/components/site/ProductForm";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/sell/new")({
  component: NewProductPage,
});

function NewProductPage() {
  const { user, isSeller, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      toast.info("سجّل دخولك أولاً");
      navigate({ to: "/login" });
    } else if (!isSeller) {
      toast.error("فقط حسابات البائعين يمكنها إضافة منتجات");
      navigate({ to: "/" });
    }
  }, [user, isSeller, loading, navigate]);

  if (loading || !user || !isSeller) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">جاري التحميل...</div>
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
            <span>إضافة منتج</span>
          </nav>
          <h1 className="text-2xl font-black md:text-3xl">
            <span className="text-primary">●</span> إضافة منتج جديد
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">املأ البيانات أدناه لنشر منتجك في السوق.</p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-xl md:p-7">
          <ProductForm
            userId={user.id}
            submitLabel="نشر المنتج"
            onSubmit={async (values) => {
              const { data, error } = await supabase
                .from("products")
                .insert({ ...values, seller_id: user.id })
                .select("id")
                .single();
              if (error) throw error;
              toast.success("تم نشر المنتج بنجاح 🎉");
              navigate({ to: "/products/$id", params: { id: data.id } });
            }}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
