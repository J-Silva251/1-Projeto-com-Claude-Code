import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Aplica middleware em todas as rotas exceto API, assets e arquivos estáticos
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
