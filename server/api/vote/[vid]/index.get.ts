import prisma from '~/lib/prisma'

export default defineEventHandler(async e => {
  const voteId = e.context.params?.vid as string
  const vote = await prisma.vote.findFirst({
    where: { uuid: voteId },
    include: {
      event: true,
    },
  })

  if (vote && vote.event) {
    vote.event.data = JSON.parse(vote.event.data) || {}
    vote.data = JSON.parse(vote.data) || {}
  }

  return vote
})
