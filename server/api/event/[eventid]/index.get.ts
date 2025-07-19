import prisma from '~/lib/prisma'

export default defineEventHandler(async (e) => {
  const eventid = e.context.params?.eventid as string
  const secret = getCookie(e, 'secret') || getQuery(e).secret
  const event = await prisma.event.findUnique({
    where: { uuid: eventid },
    include: {
      votes: true
    }
  })
  
  if (!event) {
    throw createError({ statusCode: 404, statusMessage: 'Event not found' })
  }
  
  event.data = JSON.parse(event.data)
  if (secret !== event.secret) {
    delete (event as any).secret
    delete (event as any).uuid
    delete (event as any).createdAt
  }
  return event
})