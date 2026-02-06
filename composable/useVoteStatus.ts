import type { Event } from '@prisma/client'
import { VoteStatus } from '~/constants/VoteStatus'

export function useVoteStatus(event: Ref<Event>) {
  return computed(() => {
    const now = new Date()
    if (now < new Date(event.value.startAt)) {
      return VoteStatus.NOT_STARTED
    } else if (now > new Date(event.value.endAt)) {
      return VoteStatus.ENDED
    }
    return VoteStatus.IN_PROGRESS
  })
}
