<template>
  <div class="account-menu floating-panel z-40 py-1 outline-none">
    <slot />
  </div>
</template>

<style scoped>
.account-menu {
  --account-enter-offset: -4px;
  transform-origin: var(--reka-dropdown-menu-content-transform-origin);
  width: 12rem;
  overflow: hidden;
}

.account-menu[data-side='top'] {
  --account-enter-offset: 4px;
}

/* Reka Presence keeps the menu mounted until the exit animation ends. */
.account-menu[data-state='open'] {
  animation: account-menu-open 180ms cubic-bezier(0.2, 0, 0, 1);
}

.account-menu[data-state='closed'] {
  pointer-events: none;
  animation: account-menu-close 120ms ease-in forwards;
}

@keyframes account-menu-open {
  from {
    opacity: 0;
    transform: translateY(var(--account-enter-offset)) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes account-menu-close {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(var(--account-enter-offset)) scale(0.96);
  }
}

@media (prefers-reduced-motion: reduce) {
  .account-menu[data-state] {
    animation: none;
  }
}
</style>
