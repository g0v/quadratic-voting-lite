import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (e) => {
  const { data } = await readBody(e)
  const voteId = e.context.params?.vid as string
  const vote = await prisma.vote.findUnique({
    where: { uuid: voteId },
    include: {
      event: true
    }
  })
  if (!vote) {
    throw createError({ statusCode: 404, statusMessage: 'Vote not found' })
  }
  let usedCredits = 0
  Object.keys(data).forEach(key => {
    usedCredits += data[key] * data[key] || 0
  })
  if (usedCredits > vote.event.credits) {
    throw createError({ statusCode: 400, statusMessage: 'Not enough credits' })
  }
  await prisma.vote.update({
    where: { uuid: voteId },
    data: { data: JSON.stringify(data) }
  })
  return vote
})