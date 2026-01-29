<script setup>
import { marked } from 'marked'
marked.setOptions({
  breaks: true,
  gfm: true
})
const { vid } = useRoute().params
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

const timeStatus = computed(() => {
  const now = new Date()
  if (now < new Date(event.value.startAt)) {
    return 0
  } else if (now > new Date(event.value.endAt)) {
    return 2
  }
  return 1
})

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
        alert(error.statusMessage)
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
    const _res = confirm(`You have already voted for this event. Do you want to jump to your vote?`)
    if (_res) {
      window.location.href = `/vote/${storedVid}`
    }
  }
  resetTimeout()
})
</script>
<template>
  <div class="container py-10">
    <div class="grid md:grid-cols-2 gap-4 mb-10 pb-10 border-b">
      <div>
        <h1 class="mb-4">{{ event.title }}</h1>
        <div v-if="event.description" v-html="marked.parse(event.description)" class="mb-6 p-4 bg-white/50 rounded">
        </div>
        <p>{{ new Date(event.startAt).toLocaleString([], { hour12: false }) }} ~ {{ new
          Date(event.endAt).toLocaleString([], { hour12: false }) }}</p>
      </div>
      <div v-if="timeStatus === 1" class="fixed bottom-0 left-0 right-0 bg-white z-50 py-2"
        style="filter: drop-shadow(0px -3px 3px rgba(0, 0, 0, 0.12));">
        <div class="container flex justify-between items-center gap-2">
          <div class="me-auto">Credits: {{ credits }}/{{ maxCredits }}</div>
          <span class="text-xs text-stone-500">{{ new Date(lastSavedAt).toLocaleString([], { hour12: false }) }}</span>
          <button @click="voteChanged = true" class="text-white"
            :class="voteChanged ? 'bg-yellow-500' : 'bg-green-500'">
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
      <div v-for="subject in event.data.subjects" :key="subject"
        class="p-4 bg-white drop-shadow-md rounded-md grid md:grid-cols-[1fr_auto_10rem] gap-4">
        <div class="overflow-hidden">
          <h2 class="wrap-break-word mb-2">{{ subject.name }}</h2>
          <p>{{ subject.description }}</p>
          <a :href="subject.url" target="_blank">{{ subject.url }}</a>
        </div>
        <div class="max-md:order-last">
          <Chart v-if="voteData[subject.id]" class="max-md:w-full" :size="voteData[subject.id]"
            :value="voteData[subject.id] * voteData[subject.id]" />
        </div>
        <div class="grid grid-cols-2 gap-2 my-auto">
          <div class="py-2 text-center border border-stone-300 font-bold rounded-md col-span-2">{{ voteData[subject.id]
            || 0 }}
          </div>
          <template v-if="timeStatus === 0">
            <div class="col-span-2 text-center">Voting not started</div>
          </template>
          <template v-else-if="timeStatus === 1">
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