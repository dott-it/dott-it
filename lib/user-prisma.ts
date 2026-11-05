import { Prisma, PrismaClient } from "@prisma/user-client"
import dotenv from 'dotenv';

    dotenv.config({ path: '.env' });
    dotenv.config({ path: '.env.local', override: true });
    
const globalForUserPrisma = globalThis as unknown as {
  userPrisma: InstanceType<typeof PrismaClient> | undefined
}

function createUserPrisma() {
  const url = process.env.USER_DATABASE
  if (!url) {
    throw new Error('USER_DATABASE is not set in .env')
  }
     const options: Prisma.PrismaClientOptions = {
              log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
          }
    options.datasources = { userDb: { url: url } }

        return new PrismaClient(options)
}

export const userPrisma = globalForUserPrisma.userPrisma ?? createUserPrisma()

export function getUserPrisma() {
  return userPrisma 
}

if (process.env.NODE_ENV !== 'production') {
  globalForUserPrisma.userPrisma = userPrisma
}

