import { Link } from "@tanstack/react-router";
import { CATEGORIES, PROMO_LISTS } from "@/lib/catalog";

export function CategoriesSidebar({ activeSlug }: { activeSlug?: string }) {
  return (
    <aside className="rounded-xl bg-card p-4 ring-1 ring-border/50">
      <h3 className="mb-3 border-b border-primary/30 pb-2 text-sm font-bold text-primary">
        الأقسام
      </h3>
      <nav className="flex flex-col gap-1">
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            to="/category/$slug"
            params={{ slug: c.slug }}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition hover:bg-secondary hover:text-primary ${
              activeSlug === c.slug ? "bg-secondary text-primary font-bold" : "text-foreground"
            }`}
          >
            <span className="text-base">{c.icon}</span>
            <span className="truncate">{c.name}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export function PromoSidebar({ activeSlug }: { activeSlug?: string }) {
  return (
    <aside className="rounded-xl bg-card p-4 ring-1 ring-border/50">
      <h3 className="mb-3 border-b border-primary/30 pb-2 text-sm font-bold text-primary">
        قوائم مميزة
      </h3>
      <nav className="flex flex-col gap-1">
        {PROMO_LISTS.map((p) => (
          <Link
            key={p.slug}
            to="/list/$slug"
            params={{ slug: p.slug }}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition hover:bg-secondary hover:text-primary ${
              activeSlug === p.slug ? "bg-secondary text-primary font-bold" : "text-foreground"
            }`}
          >
            <span className="text-base">{p.icon}</span>
            <span className="truncate">{p.name}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
