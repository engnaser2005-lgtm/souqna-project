import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { CategoriesSidebar, PromoSidebar } from "@/components/site/Sidebars";
import { ProductCard } from "@/components/site/ProductCard";
import { AddProductFab } from "@/components/site/AddProductFab";
import { PROMO_LISTS, PRODUCTS } from "@/lib/catalog";

export const Route = createFileRoute("/list/$slug")({
  component: ListPage,
});

function ListPage() {
  const { slug } = Route.useParams();
  const list = PROMO_LISTS.find((l) => l.slug === slug);
  if (!list) throw notFound();

  const items = slug === "deals"
    ? PRODUCTS.filter((p) => p.oldPrice)
    : PRODUCTS.filter((p) => p.tag === slug);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <nav className="text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">الرئيسية</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{list.name}</span>
        </nav>
      </div>
      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 py-6 lg:grid-cols-[220px_minmax(0,1fr)_220px]">
        <div className="order-2 lg:order-1"><CategoriesSidebar /></div>
        <section className="order-1 lg:order-2">
          <h1 className="mb-4 text-2xl font-black">
            <span className="me-2">{list.icon}</span>{list.name}
          </h1>
          {items.length === 0 ? (
            <div className="rounded-xl bg-card p-10 text-center text-muted-foreground ring-1 ring-border/50">
              لا توجد منتجات حالياً.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
              {items.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </section>
        <div className="order-3"><PromoSidebar activeSlug={slug} /></div>
      </main>
      <AddProductFab />
      <Footer />
    </div>
  );
}
