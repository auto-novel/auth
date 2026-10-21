<template>
  <div
    class="account-menu floating-panel floating-panel-motion z-40 w-48 overflow-hidden py-1 outline-none"
  >
    <slot />
  </div>
</template>

<style scoped>
.account-menu {
  transform-origin: var(--reka-dropdown-menu-content-transform-origin);
}
</style>
