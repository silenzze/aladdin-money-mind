import { Outlet, Link, createRootRoute, HeadContent, Scripts, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Home, Wallet, ArrowRightLeft, Bitcoin, Sparkles, Settings as SettingsIcon } from "lucide-react";
import appCss from "../styles.css?url";
import { useAppStore } from "@/state/store";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Lost in the vault</h2>
        <p className="mt-2 text-sm text-muted-foreground">This route doesn't exist.</p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#0a0a0f" },
      { title: "Aladdin — Personal Financial OS" },
      { name: "description", content: "Your money, intelligently. Net worth, cashflow, crypto and DCA in one calm interface." },
      { property: "og:title", content: "Aladdin — Personal Financial OS" },
      { property: "og:description", content: "A personal financial intelligence system." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="dark bg-background text-foreground antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const onboardingCompleted = useAppStore((s) => s.onboardingCompleted);
  const location = useLocation();
  const navigate = useNavigate();
  const [hydrated, setHydrated] = useState(false);

  // Wait for Zustand persist to rehydrate before rendering app shell
  // (prevents SSR/client mismatch from localStorage-loaded state)
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Gate: redirect to onboarding if not completed
  useEffect(() => {
    if (!hydrated) return;
    const path = location.pathname;
    if (!onboardingCompleted && path !== "/onboarding") {
      navigate({ to: "/onboarding" });
    } else if (onboardingCompleted && path === "/onboarding") {
      navigate({ to: "/" });
    }
  }, [hydrated, onboardingCompleted, location.pathname, navigate]);

  const showNav = hydrated && onboardingCompleted && location.pathname !== "/onboarding";

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-[440px] flex-col">
        <main className={`flex-1 ${showNav ? "pb-24" : ""}`}>
          {hydrated ? <Outlet /> : <div className="min-h-screen" />}
        </main>
        {showNav && <BottomNav />}
      </div>
      <Toaster />
    </div>
  );
}

function BottomNav() {
  const location = useLocation();
  const items = [
    { to: "/", label: "Home", icon: Home },
    { to: "/accounts", label: "Accounts", icon: Wallet },
    { to: "/transactions", label: "Activity", icon: ArrowRightLeft },
    { to: "/crypto", label: "Crypto", icon: Bitcoin },
    { to: "/insights", label: "Insights", icon: Sparkles },
    { to: "/settings", label: "Settings", icon: SettingsIcon },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[440px] -translate-x-1/2 px-3 pb-3 pt-2">
      <div className="glass flex items-center justify-between rounded-full border border-border px-2 py-2 shadow-elevated">
        {items.map((it) => {
          const active = it.to === "/" ? location.pathname === "/" : location.pathname.startsWith(it.to);
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-full px-2 py-1.5 transition-colors ${
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
              <span className="text-[10px] font-medium">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
