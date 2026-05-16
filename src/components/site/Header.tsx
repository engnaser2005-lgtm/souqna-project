import { Link } from "@tanstack/react-router";
import { Search, User, UserPlus, ShoppingBag, LogOut, Store } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { MessagesNavButton } from "./MessagesNavButton";

export function Header() {
  const { user, profile, signOut, loading } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b-2 border-primary bg-[var(--color-header)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:gap-6">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground shadow-md">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-lg font-black text-primary">سوقنا</div>
            <div className="-mt-1 text-[10px] font-semibold tracking-widest text-muted-foreground">SOUQNA</div>
          </div>
        </Link>

        <form className="relative flex-1 max-w-2xl" onSubmit={(e) => e.preventDefault()}>
          <input
            type="search"
            placeholder="ابحث عن منتجات، ماركات وأكثر..."
            className="h-11 w-full rounded-lg border border-primary/30 bg-secondary/60 ps-4 pe-11 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="submit"
            aria-label="بحث"
            className="absolute end-1 top-1 grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground hover:opacity-90"
          >
            <Search className="h-4 w-4" />
          </button>
        </form>

        <div className="flex items-center gap-2">
          {loading ? null : user ? (
            <>
              <MessagesNavButton />
              <div className="hidden items-center gap-2 rounded-md border border-primary/30 bg-secondary/60 px-3 py-2 text-sm md:flex">
                {profile?.account_type === "seller" ? (
                  <Store className="h-4 w-4 text-primary" />
                ) : (
                  <ShoppingBag className="h-4 w-4 text-primary" />
                )}
                <span className="font-bold text-foreground">
                  {profile?.username ?? user.email?.split("@")[0]}
                </span>
                <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                  {profile?.account_type === "seller" ? "بائع" : "مشتري"}
                </span>
              </div>
              <button
                onClick={() => signOut()}
                className="hidden md:inline-flex items-center gap-1.5 rounded-md border border-primary/40 px-3 py-2 text-sm font-semibold text-foreground hover:bg-primary/10"
              >
                <LogOut className="h-4 w-4" /> خروج
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 px-3 py-2 text-sm font-semibold text-foreground hover:bg-primary/10"
              >
                <User className="h-4 w-4" /> <span className="hidden sm:inline">دخول</span>
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-bold text-primary-foreground hover:opacity-90"
              >
                <UserPlus className="h-4 w-4" /> <span className="hidden sm:inline">حساب</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
