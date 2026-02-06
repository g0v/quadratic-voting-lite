<script setup>
import Notiflix from 'notiflix'
import { marked } from 'marked'
import { VoteStatus } from '~/constants/VoteStatus'
import { useVoteStatus } from '~/composable/useVoteStatus'

const route = useRoute()
marked.setOptions({
  breaks: true,
  gfm: true,
})
const vid = route.params.vid
const vote = ref(await $fetch(`/api/vote/${vid}`))
if (!vote.value) {
  throw createError({ statusCode: 404, statusMessage: 'Vote not found' })
}
const event = ref(vote.value.event)
const maxCredits = event.value.credits
const credits = ref(0)
const voteData = ref(vote.value.data || {})
const voteSaveTimeout = ref(null)
const voteChanged = ref(false)
const lastSavedAt = ref(Date.now())

const voteStatus = useVoteStatus(event)

const resetTimeout = () => {
  if (voteSaveTimeout.value) {
    clearTimeout(voteSaveTimeout.value)
  }
  voteSaveTimeout.value = setTimeout(() => {
    saveVote()
  }, 1000)
}

const countCredits = () => {
  let usedCredits = 0
  Object.values(voteData.value).map(v => {
    usedCredits += v * v || 0
  })
  credits.value = maxCredits - usedCredits
  return usedCredits
}

const voteSubject = (subjectId, amount) => {
  let oldValue = voteData.value[subjectId] || 0
  let newValue = oldValue + amount
  if (credits.value + oldValue * oldValue < newValue * newValue) {
    return
  }
  voteChanged.value = true
  resetTimeout()
  voteData.value[subjectId] = newValue
  countCredits()
}

const saveVote = async () => {
  if (voteChanged.value) {
    try {
      await $fetch(`/api/vote/${vid}`, { method: 'POST', body: { data: voteData.value } })
      voteSaveTimeout.value = null
      voteChanged.value = false
      lastSavedAt.value = Date.now()
    } catch (error) {
      if (error.statusCode === 403) {
        Notiflix.Notify.failure(error.statusMessage)
        location.reload()
        return
      }
      throw createError({ statusCode: 500, statusMessage: error.statusMessage })
    }
  }
  localStorage.setItem(`vote-${event.value.uuid}`, vid)
  resetTimeout()
}

countCredits()
onMounted(() => {
  const storedVid = localStorage.getItem(`vote-${event.value.uuid}`)
  if (storedVid && storedVid !== vid) {
    Notiflix.Confirm.show(
      'INFO',
      'You have already voted for this event. Do you want to jump to your vote?',
      'Yes',
      'No',
      () => (window.location.href = `/vote/${storedVid}`),
      () => resetTimeout(),
    )
  }
})
</script>
<template>
  <div class="container py-10">
    <div class="mb-10 grid gap-4 border-b pb-10 md:grid-cols-2">
      <div>
        <h1 class="mb-4">{{ event.title }}</h1>
        <div
          v-if="event.description"
          v-html="marked.parse(event.description)"
          class="mb-6 rounded bg-white/50 p-4"
        ></div>
        <p>
          {{ new Date(event.startAt).toLocaleString([], { hour12: false }) }} ~
          {{ new Date(event.endAt).toLocaleString([], { hour12: false }) }}
        </p>
      </div>
      <div
        v-if="voteStatus === VoteStatus.IN_PROGRESS"
        class="fixed right-0 bottom-0 left-0 z-50 bg-white py-2"
        style="filter: drop-shadow(0px -3px 3px rgba(0, 0, 0, 0.12))"
      >
        <div class="container flex items-center justify-between gap-2">
          <div class="me-auto">Credits: {{ credits }}/{{ maxCredits }}</div>
          <ClientOnly>
            <span class="text-xs text-stone-500">{{
              new Date(lastSavedAt).toLocaleString([], { hour12: false })
            }}</span>
          </ClientOnly>
          <button
            @click="voteChanged = true"
            class="text-white"
            :class="voteChanged ? 'bg-yellow-500' : 'bg-green-500'"
          >
            <span v-if="voteChanged">Saving...</span>
            <span v-else>Saved</span>
          </button>
        </div>
      </div>
      <div>
        <p>Credits: {{ credits }}/{{ maxCredits }}</p>
        <Chart :size="parseInt(Math.sqrt(maxCredits).toFixed(0))" :value="credits" />
      </div>
    </div>
    <div class="flex flex-col gap-4 pb-16">
      <div
        v-for="subject in event.data.subjects"
        :key="subject"
        class="grid gap-4 rounded-md bg-white p-4 drop-shadow-md md:grid-cols-[1fr_auto_10rem]"
      >
        <div class="overflow-hidden">
          <h2 class="mb-2 wrap-break-word">{{ subject.name }}</h2>
          <p>{{ subject.description }}</p>
          <a :href="subject.url" target="_blank">{{ subject.url }}</a>
        </div>
        <div class="max-md:order-last">
          <Chart
            v-if="voteData[subject.id]"
            class="max-md:w-full"
            :size="voteData[subject.id]"
            :value="voteData[subject.id] * voteData[subject.id]"
          />
        </div>
        <div class="my-auto grid grid-cols-2 gap-2">
          <div class="col-span-2 rounded-md border border-stone-300 py-2 text-center font-bold">
            {{ voteData[subject.id] || 0 }}
          </div>
          <template v-if="voteStatus === VoteStatus.NOT_STARTED">
            <div class="col-span-2 text-center">Voting not started</div>
          </template>
          <template v-else-if="voteStatus === VoteStatus.IN_PROGRESS">
            <button @click="voteSubject(subject.id, -1)" class="bg-black text-white">-</button>
            <button @click="voteSubject(subject.id, 1)" class="bg-yellow-500 text-white">+</button>
          </template>
          <template v-else>
            <div class="col-span-2 text-center">Voting ended</div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
