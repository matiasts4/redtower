"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { chromeCopy } from "@/lib/copy";
import { useLanguage } from "@/lib/i18n";

export function SiteHeader() {
  const pathname = usePathname();
  const { lang, setLang } = useLanguage();
  const copy = chromeCopy[lang];

  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3 md:px-8">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-display text-2xl italic leading-none text-signal">
            {copy.masthead.signal}
          </span>
          <span className="text-xs tracking-[0.16em] uppercase">{copy.masthead.product}</span>
        </Link>
        <nav className="flex flex-1 flex-wrap items-center gap-1">
          {(["home", "scenarios", "corridor", "method", "limits"] as const).map((key) => {
            const href = key === "home" ? "/" : `/${key}`;
            const active = pathname === href;
            return (
              <Link
                key={key}
                href={href}
                className={`flex min-h-11 items-center rounded-full px-3 text-sm transition-colors duration-200 ${
                  active ? "bg-ink text-bone" : "text-ink hover:bg-field"
                }`}
              >
                {copy.nav[key]}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <Button variant={lang === "en" ? "default" : "outline"} onClick={() => setLang("en")}>
            EN
          </Button>
          <Button variant={lang === "es" ? "default" : "outline"} onClick={() => setLang("es")}>
            ES
          </Button>
          <Button variant="outline" render={<Link href="/system" />}>
            {copy.nav.system}
          </Button>
        </div>
      </div>
    </header>
  );
}
