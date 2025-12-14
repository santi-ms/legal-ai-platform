declare module 'db' {
  import { PrismaClient } from '@prisma/client';
  
  export const prisma: PrismaClient;
  export function checkDatabaseConnection(): Promise<boolean>;
}

