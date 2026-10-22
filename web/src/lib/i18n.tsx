"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { ChromeLang } from "./copy";

type LanguageValue = {
  lang: ChromeLang;
  setLang: (lang: ChromeLang) => void;
};

const LanguageContext = createContext<LanguageValue>({ lang: "en", setLang: () => {} });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<ChromeLang>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem("redtower-lang");
    if (saved === "es" || saved === "en") setLangState(saved);
  }, []);

  function setLang(next: ChromeLang) {
    setLangState(next);
    window.localStorage.setItem("redtower-lang", next);
  }

  return <LanguageContext.Provider value={{ lang, setLang }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
