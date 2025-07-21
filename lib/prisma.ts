import { PrismaClient } from "@prisma/client";

/**
 * Global variable extension for Prisma client in development
 * Prevents multiple Prisma client instances during hot reloads in development
 */
const globalForPrisma = global as unknown as { prisma: PrismaClient };

/**
 * Prisma client singleton instance
 * Uses existing global instance in development to prevent connection issues
 * Creates new instance in production
 */
export const prisma = globalForPrisma.prisma || new PrismaClient();

/**
 * Store Prisma client in global variable during development
 * This prevents creating multiple clients during Next.js hot reloads
 */
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
