import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  const result = await prisma.$queryRaw`SELECT NOW()`
  return Response.json({ result })
}