<script setup lang="ts">
interface Props {
  tabs: string[];
}

defineProps<Props>();
const model = defineModel<string>();

const activeTabClass = 'text-primary border-primary';
const inactiveTabClass =
  'text-on-surface hover:text-primary border-transparent';

const getTabClass = (tab: string) => {
  return [
    'border-b-2 pl-1 pr-1 pt-4 pb-4 text-base whitespace-nowrap cursor-pointer',
    model.value === tab ? activeTabClass : inactiveTabClass,
  ];
};
</script>

<template>
  <div class="flex justify-center gap-12 border-b border-outline-variant">
    <button
      v-for="tab in tabs"
      :key="tab"
      type="button"
      @click="model = tab"
      :class="getTabClass(tab)"
    >
      {{ tab }}
    </button>
  </div>
</template>
