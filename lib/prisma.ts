import { PrismaClient, Prisma } from '@prisma/assessmentDB'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

// Create Prisma client with optional datasource URL override
const createPrismaClient = (datasourceUrl?: string) => {
    try {
        const options: Prisma.PrismaClientOptions = {
            log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
        }

        if (datasourceUrl) {
            options.datasources = { db: { url: datasourceUrl } }
        }

        return new PrismaClient(options)
    } catch (error) {
        console.error('Failed to create Prisma client:', error)
        throw new Error('Database connection failed. Please check your database configuration.')
    }
}

// Default client uses DATABASE_URL from schema datasource
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

    
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
}
