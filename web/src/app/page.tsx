import Link from "next/link";
import { chromeCopy } from "@/lib/copy";

export default function Home() {
  const copy = chromeCopy.en;
  return (
    <main className="min-h-full bg-paper">
      <header className="bg-graphite text-bone">
        <div className="mx-auto flex max-w-6xl items-baseline gap-3 px-4 py-5 md:px-8">
          <span className="font-display text-3xl italic">{copy.masthead.signal}</span>
          <span className="text-sm tracking-[0.18em] uppercase">{copy.masthead.product}</span>
        </div>
        <div className="h-1 bg-signal" />
      </header>
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-20 md:px-8">
        <p className="font-mono text-xs tracking-[0.18em] uppercase text-signal">
          {copy.home.kicker}
        </p>
        <h1 className="max-w-4xl font-display text-5xl leading-[0.95] text-balance md:text-7xl">
          {copy.home.title}
        </h1>
        <p className="max-w-2xl text-lg leading-8">{copy.home.body}</p>
        <div className="flex flex-wrap items-center gap-6">
          <Link
            href="/system"
            className="inline-flex min-h-11 items-center bg-ink px-5 text-bone transition-colors duration-200 hover:bg-signal"
          >
            {copy.home.gallery}
          </Link>
          <p className="font-mono text-sm text-muted-foreground">{copy.home.cli}</p>
        </div>
      </section>
    </main>
  );
}
