import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (e) => {
  const { eventid, title, description, startAt, endAt, credits } = await readBody(e)
  if (eventid) {
    const secret = getCookie(e, 'secret')
    const event = await prisma.event.findUnique({
      where: {
        uuid: eventid
      }
    })
    if (secret !== event?.secret) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }
    await prisma.event.update({
      where: {
        uuid: eventid
      },
      data: {
        title,
        description,
        startAt,
        endAt,
        credits
      }
    })
    return event
  }
  else {
    const data = {
      subjects: []
    }
    const newEvent = await prisma.event.create({
      data: {
        title,
        description,
        credits,
        startAt,
        endAt,
        data: JSON.stringify(data),
        uuid: crypto.randomUUID(),
        secret: crypto.randomUUID()
      }
    })
    return newEvent
  }
})