import prisma from '~/lib/prisma'

export default defineEventHandler(async (e) => {
  const eventid = e.context.params?.eventid as string
  const secret = getCookie(e, 'secret') || getQuery(e).secret
  const event = await prisma.event.findUnique({
    where: { uuid: eventid },
    include: {
      votes: true,
    }
  })
  
  if (!event) {
    throw createError({ statusCode: 404, statusMessage: 'Event not found' })
  }
  
  let eventData = JSON.parse(event.data)
  eventData.totalVotes = 0
  eventData.totalScore = 0
  let subjects = eventData.subjects || []
  event.votes.map(vote => {
    const voteData = JSON.parse(vote.data)
    if (Object.keys(voteData).length > 0) {
      eventData.totalVotes++
    }
    Object.keys(voteData).forEach(key => {
      if (key === 'undefined') {
        return
      }
      const subject = subjects.find((subject: any) => subject.id === key)
      if (subject) {
        subject.score = (subject.score || 0) + voteData[key]
        eventData.totalScore += voteData[key]
      }
    })
  })
  if (secret !== event.secret) {
    delete (event as any).secret
    delete (event as any).uuid
    delete (event as any).createdAt
    delete (event as any).votes
  }
  event.data = eventData
  return event
})