declare module 'db' {
  import { PrismaClient } from '@prisma/client';
  
  export const prisma: PrismaClient;
  export function checkDatabaseConnection(): Promise<boolean>;
  
  // Default export para compatibilidad con CommonJS
  const db: {
    prisma: PrismaClient;
    checkDatabaseConnection: () => Promise<boolean>;
  };
  export default db;
}

