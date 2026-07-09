import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppDataProvider, useAppData } from "@/lib/app-data";
import { Sidebar, MobileNav } from "@/components/app/Sidebar";

export const Route = createFileRoute("/app")({
  ssr: false,
  component: AppLayout,
});

function AppLayout() {
  return (
    <AppDataProvider>
      <AppShell />
    </AppDataProvider>
  );
}

function AppShell() {
  const { mode } = useAppData();
  const navigate = useNavigate();

  useEffect(() => {
    if (mode === "signed-out") navigate({ to: "/auth" });
  }, [mode, navigate]);

  if (mode === "loading" || mode === "signed-out") {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="size-10 rounded-full border-2 border-brand-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg text-slate-200">
      <Sidebar />
      <main className="lg:pl-64 pb-20 lg:pb-0">
        <Outlet />
      </main>
      <MobileNav />
    </div>
  );
}
