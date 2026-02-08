import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = (process.env.SUPA_POSTGRES_URL ?? process.env.DATABASE_URL)!;

// 개발 모드에서 HMR마다 새 연결 풀이 생기는 것을 방지
const globalForDb = globalThis as unknown as { pgClient?: postgres.Sql };
const client = globalForDb.pgClient ?? postgres(connectionString);
if (process.env.NODE_ENV !== "production") globalForDb.pgClient = client;

export const db = drizzle(client, { schema });

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type Transactable = typeof db | Transaction;
