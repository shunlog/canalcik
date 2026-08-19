import "./env.ts"; // must run before PrismaClient reads DATABASE_URL
import { PrismaClient } from "@prisma/client";

// @prisma/client is deliberately NOT a dependency of this package: pnpm would
// then link a peer-variant of it whose store directory has no generated
// .prisma/client ("@prisma/client did not initialize yet"). `prisma generate`
// only writes into the root project's instance, which Node finds by walking up
// to ../node_modules from here. Don't "fix" this by adding the dependency.
export const db = new PrismaClient();

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => void db.$disconnect().then(() => process.exit(0)));
}
