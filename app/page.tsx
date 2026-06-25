import { HomeHero } from "@/components/home-hero";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-6 py-20">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,#e0f2fe_0,#ffffff_42%)]" />
      <HomeHero />
      <a
        href="/login"
        className="mt-8 inline-flex items-center justify-center gap-3 rounded-md border border-slate-300 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        Get Started
      </a>
    </main>
  );
}
