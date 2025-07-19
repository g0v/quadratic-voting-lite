<template>
  <div class="min-h-svh flex items-center justify-center p-4">
    <div class="px-4 py-6 bg-white rounded-md drop-shadow-md w-full max-w-screen-sm">
      <form @submit.prevent="createEvent" class="flex flex-col gap-4">
        <input type="text" placeholder="Event Title" v-model="title" maxlength="100" />
        <textarea placeholder="Event Description" v-model="description" maxlength="1000" />
        <div class="grid md:grid-cols-[auto_auto_auto_auto] gap-2 items-center">
          <span>Start from</span>
          <input type="datetime-local" v-model="startAt" />
          <span>to</span>
          <input type="datetime-local" v-model="endAt" />
          <ClientOnly>
            <span class="md:col-span-4 text-stone-500">Current Timezone: {{ currentTimezone }}</span>
          </ClientOnly>
        </div>
        <div class="flex gap-4 items-center">
          <span>Credits per vote</span>
          <input type="number" placeholder="Credits" v-model="credits" min="1" max="99999" />
        </div>

        <button type="submit" class="w-fit mx-auto mt-10">Create Event</button>
      </form>
    </div>
  </div>
</template>

<script setup>
const title = ref('')
const description = ref('')

const formatDateForInput = (datetime) => {
  const year = datetime.getFullYear()
  const month = String(datetime.getMonth() + 1).padStart(2, '0')
  const day = String(datetime.getDate()).padStart(2, '0')
  const hours = String(datetime.getHours()).padStart(2, '0')
  const minutes = String(datetime.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

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
    alert('Start time must be in the future')
    return
  }
  if (new Date(endAt.value) < new Date(startAt.value)) {
    alert('End time must be after start time')
  }
  const res = await $fetch('/api/event', {
    method: 'POST',
    body: {
      title: title.value,
      description: description.value,
      startAt: new Date(startAt.value),
      endAt: new Date(endAt.value),
      credits: credits.value
    }
  })
  if (res) {
    window.location.href = `/admin/${res.uuid}?secret=${res.secret}`
  }
}
</script>