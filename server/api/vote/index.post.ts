import prisma from '~/lib/prisma'

export default defineEventHandler(async e => {
  const { voteCount, eventId } = await readBody(e)
  const secret = getCookie(e, 'secret')
  const event = await prisma.event.findUnique({
    where: { uuid: eventId },
  })
  if (!event) {
    throw createError({ statusCode: 404, statusMessage: 'Event not found' })
  }
  if (secret !== event.secret) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  await prisma.vote.createMany({
    data: Array.from({ length: voteCount }, () => ({
      eventUid: eventId,
      uuid: crypto.randomUUID(),
    })),
  })

  const votes = await prisma.vote.findMany({ where: { eventUid: eventId } })
  return votes
})
