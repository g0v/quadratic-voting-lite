<script setup lang="ts">
  const props = defineProps<{
    size: number
    value: number
  }>()
  const style = computed(() => {
    return {
      '--size': Math.abs(props.size)
    }
  })
</script>
<style scoped>
  .chart {
    width: min-content;
    height: min-content;
    display: grid;
    grid-template-columns: repeat(var(--size), 10px);
    gap: 5px;
    padding: 10px;
  }
  .chart-item {
    background-color: black;
    display: block;
    width: 100%;
    aspect-ratio: 1;
  }
</style>
<template>
  <div class="chart" :style="style">
    <div v-for="i in props.value" :key="i" class="chart-item"></div>
  </div>
</template>

