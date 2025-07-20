<script setup>
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
    const res = await $fetch(`/api/vote/${vid}`, { method: 'POST', body: { data: voteData.value } })
    if (res.error) {
      throw createError({ statusCode: 500, statusMessage: res.error })
    }
    voteSaveTimeout.value = null
    voteChanged.value = false
  }
  resetTimeout()
}

countCredits()
onMounted(() => {
  resetTimeout()
})

</script>

<template>
  <div class="container py-10">
    <div class="grid grid-cols-2 gap-4 mb-10 pb-10 border-b">
      <div>
        <h1>{{ event.title }}</h1>
        <p>{{ event.description }}</p>
        <p>{{ new Date(event.startAt).toLocaleString() }} ~ {{ new Date(event.endAt).toLocaleString() }}</p>
        <p v-if="voteChanged" class="text-yellow-500">Saving...</p>
        <p v-else class="text-green-500">Saved</p>
      </div>
      <div>
        <p>Credits: {{ credits }}/{{ maxCredits }}</p>
        <Chart :size="parseInt(Math.sqrt(maxCredits).toFixed(0))" :value="credits" />
      </div>
    </div>
    <div class="flex flex-col gap-4">
      <div v-for="subject in event.data.subjects" :key="subject"
        class="p-4 bg-white drop-shadow-md rounded-md grid md:grid-cols-[1fr_auto_10rem] gap-4">
        <div class="overflow-hidden">
          <h2 class="break-words">{{ subject.name }}</h2>
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