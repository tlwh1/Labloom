import { neon, neonConfig } from "@neondatabase/serverless";

neonConfig.fetchConnectionCache = true;

function resolveConnectionString() {
  const pooled = process.env.NETLIFY_DATABASE_URL;
  const fallback = process.env.DATABASE_URL;

  if (pooled) return pooled;
  if (fallback) return fallback;
  return null;
}

export function hasDatabaseConnection() {
  return resolveConnectionString() !== null;
}

export function getSqlClient() {
  const connectionString = resolveConnectionString();
  if (!connectionString) {
    throw new Error(
      "데이터베이스 연결 문자열이 설정되지 않았습니다. NETLIFY_DATABASE_URL을 확인하세요."
    );
  }
  return neon(connectionString);
}

export type SqlClient = ReturnType<typeof getSqlClient>;
