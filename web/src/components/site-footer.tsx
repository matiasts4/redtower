"use client";

import Link from "next/link";
import { chromeCopy } from "@/lib/copy";
import { useLanguage } from "@/lib/i18n";

export function SiteFooter({ surface = "public" }: { surface?: "public" | "work" }) {
  const { lang } = useLanguage();
  const copy = chromeCopy[lang];
  const work = surface === "work";

  return (
    <footer className="mt-16 border-t border-rule bg-graphite text-bone">
      <div className={`mx-auto grid gap-4 px-4 py-8 md:px-8 ${work ? "max-w-7xl" : "max-w-6xl"}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="flex items-baseline gap-2">
            <span className={work ? "text-sm font-medium tracking-[0.14em]" : "font-display text-2xl italic text-bone"}>{copy.masthead.signal}</span>
            <span className="text-xs tracking-[0.16em] uppercase">{copy.masthead.product}</span>
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/#method" className="hover:text-bone/70">
              {copy.nav.method}
            </Link>
            <Link href="/#limits" className="hover:text-bone/70">
              {copy.nav.limits}
            </Link>
            <Link href="/system" className="hover:text-bone/70">
              {copy.nav.system}
            </Link>
          </div>
        </div>
        <p className="text-sm text-bone/70">{copy.footer.line}</p>
      </div>
    </footer>
  );
}
