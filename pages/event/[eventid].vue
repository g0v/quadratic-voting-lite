<script setup>
import { marked } from 'marked'
marked.setOptions({
  breaks: true,
  gfm: true,
})

const { eventid } = useRoute().params
const { data: event, refresh, error } = await useFetch(`/api/event/${eventid}`)

if (error.value) {
  if (error.value.statusCode === 404) {
    throw createError({ statusCode: 404, statusMessage: 'Event not found' })
  }
  throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
}

const subjects = computed(() => event?.value?.data.subjects)
const totalScore = computed(() => event?.value?.data.totalScore)
const totalVotes = computed(() => event?.value?.data.totalVotes)
const totalMoney = computed(() => event?.value?.totalMoney)

const computedMoney = score => {
  if (totalScore.value === 0) return 0
  const money = Math.round((totalMoney.value / totalScore.value) * score)
  return money
}

let stopped = false
const POLL_INTERVAL = 5000
const poll = async () => {
  if (stopped) return
  await refresh()
  setTimeout(poll, POLL_INTERVAL)
}

onMounted(() => {
  setTimeout(poll, POLL_INTERVAL)
})

onUnmounted(() => {
  stopped = true
})
</script>

<template>
  <div v-if="event" class="container py-10">
    <h1 class="mb-6">{{ event.title }}</h1>
    <div class="mb-4 text-sm">
      <span>{{ new Date(event.startAt).toLocaleString([], { hour12: false }) }}</span> ~
      <span> {{ new Date(event.endAt).toLocaleString([], { hour12: false }) }}</span>
    </div>
    <div v-html="marked.parse(event.description || '')" class="mb-6 rounded bg-white/50 p-4"></div>
    <div class="text-end"><Icon>emoji_people</Icon> {{ totalVotes }}</div>
    <table class="w-full">
      <thead>
        <tr>
          <th>Subject</th>
          <th>Score</th>
          <th>Money</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="subject in subjects" :key="subject.id">
          <td class="wrap-break-word">{{ subject.name }}</td>
          <td class="text-center">{{ subject.score }}</td>
          <td class="text-center">{{ computedMoney(subject.score) }}</td>
        </tr>
        <tr>
          <th>Total</th>
          <th>{{ totalScore }}</th>
          <th class="p-2">{{ totalMoney }}</th>
        </tr>
      </tbody>
    </table>
  </div>
</template>
