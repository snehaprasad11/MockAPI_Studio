import mysql from "mysql2/promise";

type DbValue = string | number | boolean | null | Date | Buffer | Uint8Array;
type DbParams = Record<string, DbValue>;

let pool: mysql.Pool | null = null;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DATABASE_HOST ?? "localhost",
      port: Number(process.env.DATABASE_PORT ?? 3306),
      user: process.env.DATABASE_USER ?? "root",
      password: process.env.DATABASE_PASSWORD ?? "",
      database: process.env.DATABASE_NAME ?? "mockapi_studio",
      connectionLimit: 10,
      namedPlaceholders: true,
      ssl: process.env.DATABASE_SSL === "true" ? { minVersion: "TLSv1.2" } : undefined,
    });
  }

  return pool;
}

export async function queryRows<T>(sql: string, params: DbParams = {}) {
  const [rows] = await getPool().execute(sql, params);
  return rows as T[];
}

export async function queryOne<T>(sql: string, params: DbParams = {}) {
  const rows = await queryRows<T>(sql, params);
  return rows[0] ?? null;
}

export async function execute(sql: string, params: DbParams = {}) {
  const [result] = await getPool().execute(sql, params);
  return result as mysql.ResultSetHeader;
}
