<script setup lang="ts">
  const props = defineProps<{
    size: number
    value: number
  }>()
  const style = computed(() => {
    if (props.size < 10) {
      var blockSize = 10
    } else {
      var blockSize = Math.floor(100 / props.size) + 1
    }
    return {
      '--size': Math.abs(props.size),
      '--block-size': blockSize + 'px'
    }
  })
</script>
<style scoped>
  .chart {
    width: min-content;
    height: min-content;
    display: grid;
    grid-template-columns: repeat(var(--size), var(--block-size));
    gap: 3px;
    padding: 1px;
  }
  .chart-item {
    display: block;
    width: 100%;
    aspect-ratio: 1;
  }
</style>
<template>
  <div class="chart" :style="style">
    <div v-for="i in props.size * props.size" :key="i" class="chart-item" :class="{'bg-black': i <= props.value}"></div>
  </div>
</template>

