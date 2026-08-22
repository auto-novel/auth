import { ref } from 'vue';

const STORAGE_KEY = 'admin-theme';
const savedTheme = localStorage.getItem(STORAGE_KEY);
const isDark = ref(
  savedTheme
    ? savedTheme === 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches,
);

function toggleTheme() {
  isDark.value = !isDark.value;
  localStorage.setItem(STORAGE_KEY, isDark.value ? 'dark' : 'light');
}

export function useAdminTheme() {
  return { isDark, toggleTheme };
}
