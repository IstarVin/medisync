import 'dotenv';
import { defineConfig } from 'drizzle-kit';

const DATABASE_PATH = process.env.DATABASE_URL || './data/database.sqlite';

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	dialect: 'sqlite',
	dbCredentials: { url: DATABASE_PATH },
	verbose: true,
	strict: true
});
