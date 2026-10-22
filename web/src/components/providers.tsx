"use client";

import { LanguageProvider } from "@/lib/i18n";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <TooltipProvider>{children}</TooltipProvider>
    </LanguageProvider>
  );
}
