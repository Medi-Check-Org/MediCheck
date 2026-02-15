// import { PrismaClient } from "@prisma/client";
// import { withAccelerate } from "@prisma/extension-accelerate";

// const prismaClientSingleton = () => {
//   return new PrismaClient({
//     log: ["query", "info", "warn", "error"],
//   }).$extends(withAccelerate());
// };

// type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

// const globalForPrisma = globalThis as unknown as {
//   prisma: PrismaClientSingleton | undefined;
// };

// export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

// if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;



import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

// Create the base Prisma client
const createPrismaClient = () =>
  new PrismaClient({
    accelerateUrl: process.env.DATABASE_URL,
    log: ["query", "info", "warn", "error"],
  }).$extends(withAccelerate());

declare global {
  var prisma: ReturnType<typeof createPrismaClient> | undefined;
}

// Create or reuse the Prisma client with Accelerate extension
export const prisma = global.prisma ?? (createPrismaClient() as PrismaClient);

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}


