import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (e) => {
  const eventId = e.context.params?.eventid as string
  const secret = getCookie(e, 'secret')
  const event = await prisma.event.findUnique({
    where: { uuid: eventId },
    include: {
      votes: true
    }
  })
  event.data = JSON.parse(event.data)
  if (secret !== event.secret) {
    delete event.secret
    delete event.uuid
    delete event.createdAt
  }
  return event
})