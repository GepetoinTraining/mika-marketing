import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const sql = neon(process.env.STORAGE2_POSTGRES_URL!);
export const db = drizzle(sql, { schema });
export { schema };