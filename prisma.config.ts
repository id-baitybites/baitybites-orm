import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url:
      process.env.DATABASE_URL ||
      process.env.DIRECT_URL ||
      "postgresql://neondb_owner:dummy@localhost:5432/neondb",
  },
});
