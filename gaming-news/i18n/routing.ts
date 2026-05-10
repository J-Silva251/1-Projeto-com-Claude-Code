import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["pt", "en", "es"],
  defaultLocale: "pt",
  // Detecta idioma do browser automaticamente (Accept-Language header)
  // O usuário pode substituir manualmente via seletor de idioma
  localeDetection: true,
});
