<script setup>
import Notiflix from 'notiflix'
import { formatDateForInput } from '~/utils/formatDateForInput'

const router = useRouter()

const title = ref('')
const description = ref('')
const waitResponse = ref(false)

const currentTime = new Date()
const startAt = ref(formatDateForInput(new Date(currentTime.getTime() + 1000 * 60 * 60 * 1)))
const endAt = ref(formatDateForInput(new Date(currentTime.getTime() + 1000 * 60 * 60 * 24)))
const credits = ref(99)

const currentTimezone = computed(() => {
  const offset = new Date().toLocaleString('en-US', { timeZoneName: 'short' })
  return offset.split(' ').pop()
})

const createEvent = async () => {
  if (new Date(startAt.value) < new Date()) {
    Notiflix.Report.failure('Failed', 'Start time must be in the future', 'OK')
    return
  }
  if (new Date(endAt.value) < new Date(startAt.value)) {
    Notiflix.Report.failure('Failed', 'End time must be after start time', 'OK')
    return
  }

  waitResponse.value = true
  const res = await $fetch('/api/event', {
    method: 'POST',
    body: {
      title: title.value,
      description: description.value,
      startAt: new Date(startAt.value),
      endAt: new Date(endAt.value),
      credits: credits.value,
    },
  })
  waitResponse.value = false

  if (res) {
    router.push({ path: `/admin/${res.uuid}`, query: { secret: res.secret } })
  }
}
</script>

<template>
  <div class="flex min-h-svh items-center justify-center p-4">
    <div class="w-full max-w-screen-sm rounded-md bg-white px-4 py-6 drop-shadow-md">
      <form @submit.prevent="createEvent" class="flex flex-col gap-4">
        <input type="text" placeholder="Event Title" v-model="title" maxlength="100" />
        <textarea placeholder="Event Description" v-model="description" maxlength="1000" />
        <div class="grid items-center gap-2 md:grid-cols-[auto_auto_auto_auto]">
          <span>Start from</span>
          <input type="datetime-local" v-model="startAt" />
          <span>to</span>
          <input type="datetime-local" v-model="endAt" />
          <span class="inline-block min-h-6 leading-6 text-stone-500 md:col-span-4">
            <ClientOnly>Current Timezone: {{ currentTimezone }}</ClientOnly>
          </span>
        </div>
        <div class="flex items-center gap-4">
          <span>Credits per vote</span>
          <input type="number" placeholder="Credits" v-model="credits" min="1" max="99999" />
        </div>

        <button type="submit" class="mx-auto mt-10 w-fit" :disabled="waitResponse">
          <Spinner v-if="waitResponse" />Create Event
        </button>
      </form>
    </div>
  </div>
</template>
