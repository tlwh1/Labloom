import { neon, neonConfig } from "@neondatabase/serverless";

neonConfig.fetchConnectionCache = true;

function getConnectionString() {
  const pooled = process.env.NETLIFY_DATABASE_URL;
  const fallback = process.env.DATABASE_URL;

  if (pooled) return pooled;
  if (fallback) return fallback;
  throw new Error("데이터베이스 연결 문자열이 설정되지 않았습니다. NETLIFY_DATABASE_URL을 확인하세요.");
}

export function getSqlClient() {
  const connectionString = getConnectionString();
  return neon(connectionString);
}

export type SqlClient = ReturnType<typeof getSqlClient>;
