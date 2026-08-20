<script setup lang="ts">
import { roundClass } from './util';

interface Props {
  text: string;
  type?: 'button' | 'submit' | 'reset';
  round?: string;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'button',
  round: 'full',
  loading: false,
});

const buttonClass = computed(() => [
  'h-12 w-full cursor-pointer border-0 ease-in-out outline-none',
  'text-base font-medium text-on-primary transition-all duration-200',
  'bg-primary hover:bg-primary-hover active:bg-primary-pressed',
  'disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500',
  { loading: props.loading },
  roundClass(props.round),
]);
</script>

<template>
  <button v-bind="$attrs" :type="props.type" :class="buttonClass">
    {{ props.text }}
  </button>
</template>

<style>
.loading {
  position: relative;
  color: transparent !important;

  &:after {
    content: '';
    position: absolute;
    width: 10px;
    height: 10px;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    animation: loading-dot-flashing 1s infinite ease alternate;
  }
}

@keyframes loading-dot-flashing {
  0% {
    box-shadow:
      16px 0 rgba(255, 255, 255, 0.3),
      -16px 0 rgba(255, 255, 255, 0.3);
    background: rgba(255, 255, 255, 0.3);
  }

  100% {
    box-shadow:
      16px 0 rgba(255, 255, 255, 0.7),
      -16px 0 rgba(255, 255, 255, 0.7);
    background: rgba(255, 255, 255, 0.7);
  }
}
</style>
