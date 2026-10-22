"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { chromeCopy, type ChromeLang } from "@/lib/copy";

export function Masthead({
  lang,
  onLang,
}: {
  lang: ChromeLang;
  onLang: (lang: ChromeLang) => void;
}) {
  const copy = chromeCopy[lang];
  return (
    <header className="bg-graphite text-bone">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-8">
        <Link href="/" className="flex items-baseline gap-3">
          <span className="font-display text-3xl italic leading-none text-bone">
            {copy.masthead.signal}
          </span>
          <span className="text-sm tracking-[0.18em] uppercase">{copy.masthead.product}</span>
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-bone/70">
            {copy.masthead.reading} · {copy.masthead.notDesk}
          </p>
          <div className="flex gap-2">
            <Button
              variant={lang === "en" ? "secondary" : "outline"}
              className="border-bone/30 bg-transparent text-bone hover:bg-bone hover:text-ink"
              onClick={() => onLang("en")}
              aria-pressed={lang === "en"}
            >
              EN
            </Button>
            <Button
              variant={lang === "es" ? "secondary" : "outline"}
              className="border-bone/30 bg-transparent text-bone hover:bg-bone hover:text-ink"
              onClick={() => onLang("es")}
              aria-pressed={lang === "es"}
            >
              ES
            </Button>
          </div>
        </div>
      </div>
      <div className="h-1 bg-signal" />
    </header>
  );
}
