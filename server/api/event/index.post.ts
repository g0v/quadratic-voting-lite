import prisma from '~/lib/prisma'

export default defineEventHandler(async e => {
  const { eventid, title, description, startAt, endAt, credits, totalMoney } = await readBody(e)
  if (eventid) {
    const secret = getCookie(e, 'secret')
    const event = await prisma.event.findUnique({
      where: { uuid: eventid },
      include: { votes: true },
    })
    if (secret !== event?.secret) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const updatedEvent = await prisma.event.update({
      where: { uuid: eventid },
      data: { title, description, startAt, endAt, credits, totalMoney },
      include: { votes: true },
    })
    return updatedEvent
  } else {
    const data = {
      subjects: [],
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
        secret: crypto.randomUUID(),
      },
    })
    setCookie(e, 'secret', newEvent.secret, { httpOnly: true, sameSite: 'lax' })

    return newEvent
  }
})
