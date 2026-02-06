<script setup>
import Notiflix from 'notiflix'
import { formatDateForInput } from '~/utils/formatDateForInput'
import { VoteStatus } from '~/constants/VoteStatus'
import { useVoteStatus } from '~/composable/useVoteStatus'

const route = useRoute()
const eventid = route.params.eventid
const secret = route.query.secret

const { data: event, error } = await useFetch(`/api/event/${eventid}`, {
  query: { secret },
})
if (error.value && error.value.statusCode === 404) {
  throw createError({ statusCode: 404, statusMessage: 'Event not found' })
}
if (!event.value?.secret) {
  throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
}

const voteCount = ref(20)
const printPage = ref(false)
const subjects = ref(event.value.data.subjects || [])
const newSubject = ref({})
const title = ref(event.value.title)
const description = ref(event.value.description)
const startAt = ref(formatDateForInput(new Date(event.value.startAt)))
const endAt = ref(formatDateForInput(new Date(event.value.endAt)))
const credits = ref(event.value.credits)
const totalMoney = ref(event.value.totalMoney)
const waitingRequest = ref(false)
const voteStatus = useVoteStatus(event)

const url = useRequestURL()
const currentTimezone = new Date().toLocaleString('en-US', { timeZoneName: 'short' }).split(' ').pop()
const adminLink = url.href
const resultLink = `${url.origin}/event/${eventid}`

const _updateEvent = async () => {
  const startAtDate = new Date(startAt.value)
  const endAtDate = new Date(endAt.value)

  waitingRequest.value = 'ue'
  const res = await $fetch('/api/event', {
    method: 'POST',
    body: {
      eventid: eventid,
      title: title.value,
      description: description.value,
      startAt: startAtDate,
      endAt: endAtDate,
      credits: credits.value,
      totalMoney: totalMoney.value,
    },
  })
  waitingRequest.value = false
  event.value = res
}

const updateEvent = () => {
  const now = new Date()
  const startAtDate = new Date(startAt.value)
  const endAtDate = new Date(endAt.value)

  if (endAtDate < startAtDate) {
    Notiflix.Report.failure('Failed', 'End time must be after start time', 'OK', () => {
      endAt.value = formatDateForInput(new Date(event.value.endAt))
    })
    return
  }

  if (voteStatus.value !== VoteStatus.IN_PROGRESS && startAtDate <= now) {
    Notiflix.Confirm.show(
      'INFO',
      'Start time is in the past, vote will start immediately. Do you want to continue?',
      'Yes',
      'No',
      _updateEvent,
    )
    return
  }

  if (voteStatus.value === VoteStatus.IN_PROGRESS && startAtDate > now) {
    Notiflix.Confirm.show(
      'INFO',
      'Start time is in the future, vote will stop immediately. Do you want to continue?',
      'Yes',
      'No',
      _updateEvent,
    )
    return
  }

  _updateEvent()
}

const newVoteStartIndex = ref(Infinity)
const generateVotes = async () => {
  waitingRequest.value = 'gv'
  const newVotes = await $fetch(`/api/event/${eventid}/generate`, {
    method: 'POST',
    body: {
      voteCount: voteCount.value,
    },
  })
  waitingRequest.value = false

  newVoteStartIndex.value = event.value.votes.length
  event.value.votes = newVotes

  await nextTick()
  document.querySelector('.newVote').scrollIntoView({ behavior: 'smooth' })
}

const getQRData = voteId => {
  const url = new URL(`/vote/${voteId}`, window.location.origin)
  return encodeURIComponent(url.toString())
}

const PrintPage = async () => {
  printPage.value = true
  await nextTick()
  window.print()
  printPage.value = false
}

const copyLink = async link => {
  try {
    await navigator.clipboard.writeText(link)
    Notiflix.Notify.success('Link copied to clipboard!')
  } catch (err) {
    console.error('Failed to copy: ', err)
    Notiflix.Notify.failure('Failed to copy link')
  }
}

const editSubject = async subject => {
  waitingRequest.value = 'as'
  newSubject.value = subject
  subjects.value = subjects.value.filter(s => s.id !== subject.id)
  await $fetch(`/api/event/${eventid}/subject/delete`, {
    method: 'POST',
    body: {
      subjectId: subject.id,
    },
  })
  waitingRequest.value = false
}

const addSubject = async () => {
  if (!newSubject.value.name) {
    return
  }
  waitingRequest.value = 'as'
  const _temp = newSubject.value
  newSubject.value = {}
  const _subjects = await $fetch(`/api/event/${eventid}/subject/add`, {
    method: 'POST',
    body: {
      subject: _temp,
    },
  })
  subjects.value = _subjects
  waitingRequest.value = false
}
</script>

<template>
  <div class="container py-10">
    <div v-if="!printPage" class="rounded-md bg-white p-4 drop-shadow-md">
      <ClientOnly>
        <div class="mb-4">
          <h3 class="mb-4">Admin Link <span class="text-red-600">(Please keep this link private)</span></h3>
          <div @click="copyLink(adminLink)" class="cursor-pointer rounded-md border border-stone-300 p-1">
            {{ adminLink }}
            <Icon>copy_all</Icon>
          </div>
        </div>
      </ClientOnly>
      <ClientOnly>
        <div class="mb-4">
          <h3 class="mb-4">Statistic Link</h3>
          <div @click="copyLink(resultLink)" class="cursor-pointer rounded-md border border-stone-300 p-1">
            {{ resultLink }}
            <Icon>copy_all</Icon>
          </div>
        </div>
      </ClientOnly>
      <form @submit.prevent="updateEvent" class="mb-20 flex flex-col gap-4 rounded-md border border-stone-300 p-4">
        <h4>Event Title<span class="text-red-600"> *</span></h4>
        <input
          type="text"
          placeholder="Event Title"
          v-model="title"
          :disabled="voteStatus !== VoteStatus.NOT_STARTED"
          required
        />
        <h4>Event Description</h4>
        <textarea placeholder="Event Description" v-model="description"></textarea>
        <hr v-if="voteStatus !== VoteStatus.NOT_STARTED" class="my-4 border-stone-300" />
        <div class="mb-6 flex gap-4">
          <div>
            <h4>Credits<span class="text-red-600"> *</span></h4>
            <input type="number" placeholder="Credits" v-model="credits" min="1" max="999" required />
          </div>
          <div>
            <h4>Total Money<span class="text-red-600"> *</span></h4>
            <input type="number" class="w-full" placeholder="Credits" v-model="totalMoney" min="0" required />
          </div>
        </div>
        <h4>Event Duration<span class="text-red-600"> *</span></h4>
        <div class="grid w-max items-center gap-4 md:grid-cols-[auto_auto_auto_auto]">
          <span>Start from</span>
          <input type="datetime-local" v-model="startAt" required />
          <span>to</span>
          <input type="datetime-local" v-model="endAt" required />
        </div>
        <ClientOnly>
          <span class="text-stone-500 md:col-span-4">Current Timezone: {{ currentTimezone }}</span>
        </ClientOnly>

        <button type="submit" class="mx-auto w-fit" :disabled="waitingRequest === 'ue'">
          <Spinner v-if="waitingRequest === 'ue'" />Update Event
        </button>
      </form>
      <h3>Subjects</h3>
      <div class="my-5 flex flex-col gap-2 rounded-md border border-stone-300 bg-stone-100">
        <div v-if="subjects.length === 0" class="p-4">No subjects added</div>
        <div
          v-for="(subject, index) in subjects"
          :key="subject.name"
          class="grid grid-cols-[auto_1fr] gap-2 border-stone-300 p-2"
          :class="{ 'border-t': index !== 0 }"
        >
          <button
            v-if="voteStatus === VoteStatus.NOT_STARTED"
            @click="editSubject(subject)"
            class="h-min w-min bg-yellow-500 px-2 py-2"
          >
            <Icon>edit</Icon>
          </button>
          <div>
            <h5>{{ subject.name }}</h5>
            <div>{{ subject.description }}</div>
            <a :href="subject.url" target="_blank">{{ subject.url }}</a>
          </div>
        </div>
      </div>
      <template v-if="voteStatus === VoteStatus.NOT_STARTED">
        <form @submit.prevent="addSubject" class="my-5 flex flex-col gap-2 rounded-md border border-stone-300 p-4">
          <label for="subjectName">Subject Name<span class="text-red-600"> *</span> </label>
          <input type="text" v-model="newSubject.name" required />
          <label for="subjectDescription">Subject Description </label>
          <textarea v-model="newSubject.description"></textarea>
          <label for="subjectUrl">Subject URL </label>
          <input type="text" v-model="newSubject.url" />
          <button type="submit" class="mx-auto mt-4 w-fit" :disabled="waitingRequest === 'as'">
            <Spinner v-if="waitingRequest === 'as'" />Add Subject
          </button>
        </form>
      </template>
    </div>
    <form v-if="!printPage" @submit.prevent="generateVotes" class="mt-20 mb-5 grid items-center gap-2 md:grid-cols-3">
      <div class="flex items-center gap-2">
        <button type="submit" :disabled="waitingRequest === 'gv'"><Spinner v-if="waitingRequest === 'gv'" />Add</button>
        <input type="number" v-model="voteCount" min="1" max="999" />
        <span>Voter</span>
      </div>
      <span class="text-stone-500">Current Voters: {{ event.votes.length }}</span>
      <button @click="PrintPage" class="ms-auto">Print Page</button>
    </form>
  </div>
  <div class="grid grid-cols-2 bg-white">
    <div
      v-for="(vote, index) in event.votes"
      :key="vote.uuid"
      class="break-inside-avoid border p-2"
      :class="index >= newVoteStartIndex ? 'newVote' : ''"
    >
      <a target="_blank" :href="`/vote/${vote.uuid}`" class="flex gap-2 no-underline">
        <div class="flex flex-col gap-2 text-stone-500">
          <div>{{ index + 1 }}. {{ vote.uuid }}</div>
          <div class="mt-auto">{{ title }}</div>
        </div>
        <div class="ms-auto aspect-square w-40">
          <ClientOnly>
            <img
              class="w-40 p-2"
              :src="`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${getQRData(vote.uuid)}`"
            />
          </ClientOnly>
        </div>
      </a>
    </div>
  </div>
</template>

<style>
.newVote {
  animation: blink 0.6s ease-in-out 3;
}

@keyframes blink {
  50% {
    background: var(--color-amber-200);
  }
}
</style>
