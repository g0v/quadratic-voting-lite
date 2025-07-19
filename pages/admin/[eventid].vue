<script setup>
const { eventid } = useRoute().params
let { secret } = useRoute().query

const cookie = useCookie('secret')
if (secret) {
  cookie.value = secret
} else {
  secret = cookie.value
}

const { data: event } = await useFetch(`/api/event/${eventid}`, {
  headers: {
    cookie: `secret=${secret}`
  }
})
if (!event) {
  throw createError({ statusCode: 404, statusMessage: 'Event not found' })
}
await nextTick()
if (!event.value.secret) {
  throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
}

const formatDateForInput = (datetime) => {
  const year = datetime.getFullYear()
  const month = String(datetime.getMonth() + 1).padStart(2, '0')
  const day = String(datetime.getDate()).padStart(2, '0')
  const hours = String(datetime.getHours()).padStart(2, '0')
  const minutes = String(datetime.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const voteCount = ref(20)
const printPage = ref(false)
const subjects = ref([])
const newSubject = ref({})
const title = ref(event.value.title)
const description = ref(event.value.description)
const startAt = ref(formatDateForInput(new Date(event.value.startAt)))
const endAt = ref(formatDateForInput(new Date(event.value.endAt)))
const credits = ref(event.value.credits)
subjects.value = event.value.data.subjects || []

const updateEvent = async () => {
  if (timeStatus.value !== 0) {
    alert('Voting has started, you can not update the event')
    return
  }
  if (new Date(startAt.value) <= new Date()) {
    let res = confirm('Start time is in the past, you will not able to change things after this. Vote will start immediately. Do you want to continue?')
    if (!res) {
      return
    }
  }
  const res = await $fetch('/api/event', {
    method: 'POST',
    body: {
      eventid: eventid,
      title: title.value,
      description: description.value,
      startAt: new Date(startAt.value),
      endAt: new Date(endAt.value),
      credits: credits.value
    }
  })
  if (res) {
    window.location.reload()
  }
}

const generateVotes = async () => {
  const votes = await useFetch(`/api/event/${eventid}/generate`, {
    method: 'POST',
    body: {
      voteCount: voteCount.value
    }
  })
  window.location.reload()
}

const getQRData = (voteId) => {
  const url = new URL(`/vote/${voteId}`, window.location.origin)
  return encodeURIComponent(url.toString())
}

const PrintPage = async () => {
  printPage.value = true
  await nextTick()
  window.print()
  printPage.value = false
}

const timeStatus = computed(() => {
  const now = new Date()
  if (now < new Date(event.value.startAt)) {
    return 0
  } else if (now > new Date(event.value.endAt)) {
    return 2
  }
  return 1
})

const currentTimezone = computed(() => {
  const offset = new Date().toLocaleString('en-US', { timeZoneName: 'short' })
  return offset.split(' ').pop()
})

const adminLink = computed(() => {
  return window.location.href
})

const resultLink = computed(() => {
  return `${window.location.origin}/event/${eventid}`
})

const copyLink = async (link) => {
  try {
    await navigator.clipboard.writeText(link)
    alert('Link copied to clipboard!')
  } catch (err) {
    console.error('Failed to copy: ', err)
    alert('Failed to copy link')
  }
}

const editSubject = async (subject) => {
  newSubject.value = subject
  subjects.value = subjects.value.filter(s => s.id !== subject.id)
  await useFetch(`/api/event/${eventid}/subject/delete`, {
    method: 'POST',
    body: {
      subjectId: subject.id
    }
  })
}

const addSubject = async () => {
  subjects.value.push(newSubject.value)
  await useFetch(`/api/event/${eventid}/subject/add`, {
    method: 'POST',
    body: {
      subject: newSubject.value
    }
  })
  newSubject.value = {}
}

</script>

<template>
  <div class="container py-10">
    <div v-if="!printPage" class="bg-white rounded-md drop-shadow-md p-4">
      <ClientOnly>
        <div class="mb-4">
          <h3 class="mb-4">Admin Link <span class="text-red-500">(Please keep this link private)</span></h3>
          <div @click="copyLink(adminLink)" class="p-1 border border-stone-300 rounded-md cursor-pointer">{{ adminLink
            }}
            <Icon>copy_all</Icon>
          </div>
        </div>
      </ClientOnly>
      <ClientOnly>
        <div class="mb-4">
          <h3 class="mb-4">Statistic Link</h3>
          <div @click="copyLink(resultLink)" class="p-1 border border-stone-300 rounded-md cursor-pointer">{{ resultLink
          }}
            <Icon>copy_all</Icon>
          </div>
        </div>
      </ClientOnly>
      <form @submit.prevent="updateEvent" class="flex flex-col gap-4 mb-20 border border-stone-300 rounded-md p-4">
        <h4>Event Title</h4>
        <input type="text" placeholder="Event Title" v-model="title" :disabled="timeStatus !== 0" />
        <h4>Event Description</h4>
        <textarea placeholder="Event Description" v-model="description" :disabled="timeStatus !== 0" />
        <h4>Event Duration</h4>
        <div class="grid md:grid-cols-[auto_auto_auto_auto] w-max gap-4 items-center">
          <span>Start from</span>
          <input type="datetime-local" v-model="startAt" :disabled="timeStatus !== 0" />
          <span>to</span>
          <input type="datetime-local" v-model="endAt" :disabled="timeStatus !== 0" />
        </div>
        <ClientOnly>
          <span class="md:col-span-4 text-stone-500">Current Timezone: {{ currentTimezone }}</span>
        </ClientOnly>
        <h4>Credits per voter</h4>
        <div class="flex gap-4 items-center">
          <input type="number" placeholder="Credits" v-model="credits" min="1" max="999" :disabled="timeStatus !== 0" />
        </div>

        <button type="submit" class="w-fit mx-auto" v-if="timeStatus === 0">Update Event</button>
      </form>
      <h3>Subjects</h3>
      <div class="flex flex-col gap-2 my-5 border border-stone-300 rounded-md">
        <div v-if="subjects.length === 0" class="p-4">No subjects added</div>
        <div v-for="(subject, index) in subjects" :key="subject.name"
          class="p-2 gap-2 grid grid-cols-[auto_1fr] border-stone-300" :class="{ 'border-t': index !== 0 }">
          <button v-if="timeStatus === 0" @click="editSubject(subject)" class="bg-yellow-500 w-min h-min px-2 py-2">
            <Icon>edit</Icon>
          </button>
          <div>
            <h5>{{ subject.name }}</h5>
            <div>{{ subject.description }}</div>
            <a :href="subject.url" target="_blank">{{ subject.url }}</a>
          </div>
        </div>
      </div>
      <template v-if="timeStatus === 0">
        <form @submit.prevent="addSubject" class="my-5 p-4 border border-stone-300 rounded-md flex flex-col gap-2">
          <label for="subjectName">Subject Name
          </label>
          <input type="text" v-model="newSubject.name" />
          <label for="subjectDescription">Subject Description
          </label>
          <textarea v-model="newSubject.description" />
          <label for="subjectUrl">Subject URL
          </label>
          <input type="text" v-model="newSubject.url" />
          <button type="submit" class="w-fit mt-4 mx-auto">Add Subject</button>
        </form>
      </template>
    </div>
    <form v-if="!printPage" @submit.prevent="generateVotes" class="mt-20 mb-5 grid md:grid-cols-3 gap-2 items-center">
      <div class="flex gap-2 items-center">
        <button type="submit">Add</button>
        <input type="number" v-model="voteCount" min="1" max="999" />
        <span>Voter</span>
      </div>
      <span class="text-stone-500">Current Voters: {{ event.votes.length }}</span>
      <button @click="PrintPage" class="ms-auto">Print Page</button>
    </form>
  </div>
  <div class="grid grid-cols-2 bg-white">
    <div v-for="(vote, index) in event.votes" :key="vote.uuid" class="border p-2">
      <a target="_blank" :href="`/vote/${vote.uuid}`" class="grid md:grid-cols-[2rem_1fr_1fr] gap-4">
        <span>{{ index + 1 }}</span>
        <span>{{ vote.uuid }}</span>
        <ClientOnly>
          <img class="w-40 p-4"
            :src="`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${getQRData(vote.uuid)}`" />
        </ClientOnly>
      </a>
    </div>
  </div>
</template>