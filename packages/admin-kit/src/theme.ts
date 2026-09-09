import { ref } from 'vue';

export function createAdminTheme(storageKey: string) {
  let savedTheme: string | null | undefined;
  try {
    savedTheme = window.localStorage.getItem(storageKey);
  } catch {
    // Use the system preference when stored preferences cannot be read.
  }
  const isDark = ref(
    savedTheme === 'dark' || savedTheme === 'light'
      ? savedTheme === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches,
  );

  function toggleTheme() {
    isDark.value = !isDark.value;
    try {
      window.localStorage.setItem(storageKey, isDark.value ? 'dark' : 'light');
    } catch {
      // Theme changes remain usable without persistence.
    }
  }

  return { isDark, toggleTheme };
}

export type AdminTheme = ReturnType<typeof createAdminTheme>;
