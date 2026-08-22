import { ref } from 'vue';

export function createAdminTheme(storageKey: string) {
  const savedTheme = localStorage.getItem(storageKey);
  const isDark = ref(
    savedTheme
      ? savedTheme === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches,
  );

  function toggleTheme() {
    isDark.value = !isDark.value;
    localStorage.setItem(storageKey, isDark.value ? 'dark' : 'light');
  }

  return { isDark, toggleTheme };
}

export type AdminTheme = ReturnType<typeof createAdminTheme>;
