import { siteConfig } from "@/lib/site";

export function HomeHero() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col items-center text-center">
      <div className="mb-6 inline-flex items-center rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm backdrop-blur">
        Startup teammates, hackathon partners, and side-project builders
      </div>

      <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-7xl">
        {siteConfig.name}
      </h1>

      <p className="mt-5 max-w-2xl text-xl leading-8 text-slate-600">
        {siteConfig.tagline}
      </p>

      <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
        {["Founders", "Developers", "Designers"].map((role) => (
          <div
            key={role}
            className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm"
          >
            {role}
          </div>
        ))}
      </div>
    </section>
  );
}
