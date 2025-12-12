import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Connection string from environment
const connectionString = process.env.DATABASE_URL!;

// For query purposes
const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });

// Export schema for convenience
export { schema };

// Type helpers
export type Database = typeof db;