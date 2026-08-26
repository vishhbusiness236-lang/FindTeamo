import { HomeHero } from "@/components/home-hero";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-6 py-20">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,#e0f2fe_0,#ffffff_42%)]" />
      <HomeHero />
      <div className="mt-8 flex items-center gap-3">
        <a
          href="/login"
          className="inline-flex items-center justify-center gap-3 rounded-md border border-slate-300 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Get Started
        </a>
        <a
          href="/discover?demo=true"
          className="inline-flex items-center justify-center gap-3 rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
        >
          View Demo
        </a>
      </div>
    </main>
  );
}
