import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()

export default defineEventHandler(async (e) => {
  const { subjectId } = await readBody(e)
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
  event.data = JSON.parse(event.data)
  event.data.subjects = event.data.subjects.filter((subject: any) => subject.id !== subjectId)
  await prisma.event.update({
    where: { uuid: eventId },
    data: { data: JSON.stringify(event.data) }
  })
  return event
})