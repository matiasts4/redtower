"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { chromeCopy } from "@/lib/copy";
import { useLanguage } from "@/lib/i18n";

const links = [
  ["home", "/"],
  ["scenarios", "/#cases"],
  ["corridor", "/#corridor"],
  ["method", "/#method"],
  ["limits", "/#limits"],
] as const;

export function SiteHeader({ surface = "public" }: { surface?: "public" | "work" }) {
  const pathname = usePathname();
  const { lang, setLang } = useLanguage();
  const copy = chromeCopy[lang];
  const work = surface === "work";

  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-paper/95 backdrop-blur">
      <div className={`mx-auto flex flex-wrap items-center gap-4 px-4 py-3 md:px-8 ${work ? "max-w-7xl" : "max-w-6xl"}`}>
        <Link href="/" className="flex items-baseline gap-2">
          <span className={work ? "text-sm font-medium tracking-[0.14em] text-signal" : "font-display text-2xl italic leading-none text-signal"}>
            {copy.masthead.signal}
          </span>
          <span className="text-xs tracking-[0.16em] uppercase">{copy.masthead.product}</span>
        </Link>
        <nav className="order-last flex w-full items-center gap-1 overflow-x-auto md:order-none md:w-auto md:flex-1 md:flex-wrap">
          {links.map(([key, href]) => {
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
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Button variant={lang === "en" ? "default" : "outline"} onClick={() => setLang("en")}>
            EN
          </Button>
          <Button variant={lang === "es" ? "default" : "outline"} onClick={() => setLang("es")}>
            ES
          </Button>
          <Button variant="outline" nativeButton={false} render={<Link href="/system" />}>
            {copy.nav.system}
          </Button>
        </div>
      </div>
    </header>
  );
}
