"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { chromeCopy, type ChromeLang } from "@/lib/copy";
import { useLanguage } from "@/lib/i18n";

const links = [
  ["home", "/"],
  ["scenarios", "/#cases"],
  ["corridor", "/#corridor"],
  ["method", "/#method"],
  ["limits", "/#limits"],
] as const;

const languages: Record<ChromeLang, string> = {
  en: "English",
  es: "Español",
};

export function SiteHeader({ surface = "public" }: { surface?: "public" | "work" }) {
  const pathname = usePathname();
  const { lang, setLang } = useLanguage();
  const copy = chromeCopy[lang];
  const work = surface === "work";

  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-paper/95 backdrop-blur">
      <div
        className={`mx-auto flex flex-wrap items-center gap-4 px-4 py-3 md:px-6 lg:px-8 2xl:px-12 ${
          work ? "max-w-[1880px] w-full" : "max-w-6xl"
        }`}
      >
        <Link href="/" className="flex items-baseline gap-2">
          <span
            className={
              work
                ? "text-sm font-medium tracking-[0.14em] text-signal"
                : "font-display text-2xl italic leading-none text-signal"
            }
          >
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
          <Select
            items={languages}
            value={lang}
            onValueChange={(val) => {
              if (val === "en" || val === "es") {
                setLang(val);
              }
            }}
          >
            <SelectTrigger
              aria-label={lang === "es" ? "Seleccionar idioma" : "Select language"}
              className="data-[size=default]:h-11 min-h-11 rounded-full border-border bg-background px-3.5 text-sm font-medium hover:bg-muted"
            >
              <div className="flex items-center gap-2">
                <Globe className="size-4 text-muted-foreground" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent align="end" className="min-w-36">
              <SelectItem value="en">
                <span className="flex items-center justify-between gap-3 w-full">
                  <span>English</span>
                  <span className="text-xs text-muted-foreground">EN</span>
                </span>
              </SelectItem>
              <SelectItem value="es">
                <span className="flex items-center justify-between gap-3 w-full">
                  <span>Español</span>
                  <span className="text-xs text-muted-foreground">ES</span>
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" nativeButton={false} render={<Link href="/system" />}>
            {copy.nav.system}
          </Button>
        </div>
      </div>
    </header>
  );
}
