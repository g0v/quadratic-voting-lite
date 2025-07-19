import prisma from '~/lib/prisma'
import { nanoid } from 'nanoid'

export default defineEventHandler(async (e) => {
  const { subject } = await readBody(e)
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
  if (!subject.id){
    subject.id = nanoid(12)
  }
  event.data = JSON.parse(event.data)
  event.data.subjects.push(subject)
  await prisma.event.update({
    where: { uuid: eventId },
    data: { data: JSON.stringify(event.data) }
  })
  return event.data.subjects
})