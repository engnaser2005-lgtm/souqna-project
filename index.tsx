import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { CategoriesSidebar, PromoSidebar } from "@/components/site/Sidebars";
import { ProductCard } from "@/components/site/ProductCard";
import { AddProductFab } from "@/components/site/AddProductFab";
import { PRODUCTS } from "@/lib/catalog";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-primary/20 bg-gradient-to-l from-[var(--color-header)] via-background to-secondary/40">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: "radial-gradient(circle at 20% 50%, var(--color-primary) 0%, transparent 40%)"
        }} />
        <div className="relative mx-auto max-w-7xl px-4 py-12 md:py-20">
          <div className="max-w-2xl">
            <span className="inline-block rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              منصة البائعين الأولى
            </span>
            <h1 className="mt-4 text-3xl font-black leading-tight text-foreground md:text-5xl">
              أفضل سوق إلكتروني <span className="text-primary">للبائعين</span>
            </h1>
            <p className="mt-4 text-base text-muted-foreground md:text-lg">
              اعرض منتجاتك وابدأ البيع بسهولة. آلاف المشترين بانتظار عروضك.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button className="rounded-lg bg-primary px-6 py-3 font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90">
                ابدأ البيع الآن
              </button>
              <button className="rounded-lg border border-primary/40 bg-secondary/40 px-6 py-3 font-bold text-foreground hover:bg-secondary">
                تصفح المنتجات
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main grid */}
      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 py-8 lg:grid-cols-[220px_minmax(0,1fr)_220px]">
        {/* Right (RTL first) — Categories */}
        <div className="order-2 lg:order-1">
          <CategoriesSidebar />
        </div>

        {/* Center — products */}
        <section className="order-1 lg:order-2">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-xl font-black md:text-2xl">
              <span className="text-primary">●</span> منتجات مختارة
            </h2>
            <span className="text-xs text-muted-foreground">{PRODUCTS.length} منتج</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
            {PRODUCTS.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>

        {/* Left — promo lists */}
        <div className="order-3">
          <PromoSidebar />
        </div>
      </main>

      <AddProductFab />
      <Footer />
    </div>
  );
}
