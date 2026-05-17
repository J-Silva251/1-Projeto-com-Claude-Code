// Log estruturado de requisições. NUNCA inclui PII (email, nome).
export function logRequest(
  route: string,
  status: number,
  meta: Record<string, string | number | boolean> = {}
): void {
  console.log(
    JSON.stringify({ ts: new Date().toISOString(), route, status, ...meta })
  );
}
