import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { CategoriesSidebar, PromoSidebar } from "@/components/site/Sidebars";
import { ProductCard } from "@/components/site/ProductCard";
import { AddProductFab } from "@/components/site/AddProductFab";
import { CATEGORIES, PRODUCTS } from "@/lib/catalog";

export const Route = createFileRoute("/category/$slug")({
  component: CategoryPage,
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">القسم غير موجود</h1>
        <Link to="/" className="mt-4 inline-block text-primary underline">العودة للرئيسية</Link>
      </div>
    </div>
  ),
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const category = CATEGORIES.find((c) => c.slug === slug);
  if (!category) throw notFound();

  const items = PRODUCTS.filter((p) => p.category === slug);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <nav className="text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">الرئيسية</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{category.name}</span>
        </nav>
      </div>
      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 py-6 lg:grid-cols-[220px_minmax(0,1fr)_220px]">
        <div className="order-2 lg:order-1"><CategoriesSidebar activeSlug={slug} /></div>
        <section className="order-1 lg:order-2">
          <h1 className="mb-4 text-2xl font-black">
            <span className="me-2">{category.icon}</span>{category.name}
          </h1>
          {items.length === 0 ? (
            <div className="rounded-xl bg-card p-10 text-center text-muted-foreground ring-1 ring-border/50">
              لا توجد منتجات في هذا القسم بعد.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
              {items.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </section>
        <div className="order-3"><PromoSidebar /></div>
      </main>
      <AddProductFab />
      <Footer />
    </div>
  );
}
