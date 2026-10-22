"use client";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export function SitePage({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-paper">
      <SiteHeader />
      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:px-8">{children}</main>
      <SiteFooter />
    </div>
  );
}
