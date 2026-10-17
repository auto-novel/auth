import { type Ref } from 'vue';

import { useLocalStorage } from '../../utils/storage';

const SIDEBAR_STORAGE_KEY = 'web-kit:sidebar:v1';

export function useSidebarPreference(): Ref<boolean> {
  return useLocalStorage<boolean>(SIDEBAR_STORAGE_KEY, {
    validate: (value) => (typeof value === 'boolean' ? value : undefined),
    fallback: () => false,
  });
}
