import { PrismaClient } from '../generated';
export declare const prisma: PrismaClient<import("../generated").Prisma.PrismaClientOptions, never, import("../generated/runtime/library").DefaultArgs>;
export declare function disconnectPrisma(): Promise<void>;
export declare function checkDatabaseHealth(): Promise<boolean>;
export default prisma;
