<script setup>
import { marked } from 'marked'
marked.setOptions({
  breaks: true,
  gfm: true
})

const { eventid } = useRoute().params
const { data: event } = await useFetch(`/api/event/${eventid}`)
const subjects = ref(event.value.data.subjects)
const totalMoney = ref(event.value.data.totalMoney || 10000)
const totalScore = ref(event.value.data.totalScore)
const totalVotes = ref(event.value.data.totalVotes)

const computedMoney = (score) => {
  const money = Math.round(totalMoney.value / totalScore.value * score)
  return money
}

</script>

<template>
  <div class="container py-10">
    <h1 class="mb-6">{{ event.title }}</h1>
    <div class="text-sm mb-4"><span>{{ new Date(event.startAt).toLocaleString() }}</span> ~ <span>{{ new Date(event.endAt).toLocaleString()}}</span></div>
    <div v-html="marked.parse(event.description)" class="mb-6 p-4 bg-white/50 rounded"></div>
    <div class="text-end">
      <Icon>emoji_people</Icon> {{ totalVotes }}
    </div>
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
          <td class="break-words">{{ subject.name }}</td>
          <td class="text-center">{{ subject.score }}</td>
          <td class="text-center">{{ computedMoney(subject.score) }}</td>
        </tr>
        <tr>
          <th>Total</th>
          <th>{{ totalScore }}</th>
          <th class="p-2"><input type="number" v-model="totalMoney" class="w-full text-center" step="500" /></th>
        </tr>
      </tbody>
    </table>
  </div>
</template>