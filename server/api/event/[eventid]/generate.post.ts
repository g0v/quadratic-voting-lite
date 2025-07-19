import prisma from '~/lib/prisma'
import { nanoid } from 'nanoid'

export default defineEventHandler(async (e) => {
  const { voteCount } = await readBody(e)
  const eventId = e.context.params?.eventid as string
  const secret = getCookie(e, 'secret')
  const event = await prisma.event.findUnique({
    where: { uuid: eventId }
  })
  if (!event) {
    throw createError({ statusCode: 404, statusMessage: 'Event not found' })
  }
  if (secret !== event.secret) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  const votes = await prisma.vote.createMany({
    data: Array.from({ length: voteCount }, () => ({
      eventUid: eventId,
      uuid: crypto.randomUUID()
    }))
  })
  return votes
})