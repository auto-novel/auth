<script setup lang="ts">
import { SearchOutlined } from '@vicons/material';
import { NIcon, NInput, NSelect } from 'naive-ui';
import { ref, watch } from 'vue';

import FilterChoiceGroup from '@/components/FilterChoiceGroup.vue';
import FilterRow from '@/components/FilterRow.vue';
import TimeRangeFilter from '@/components/TimeRangeFilter.vue';

const emit = defineEmits<{
  search: [];
}>();

const actor = defineModel<string>('actor', { required: true });
const target = defineModel<string>('target', { required: true });
const actions = defineModel<string[]>('action', { required: true });
const createdRange = defineModel<[number, number] | null>('createdRange', {
  required: true,
});

const authActions = ['login', 'register', 'logout', 'otp', 'reset_password'];
const moderationActions = [
  'trust-user',
  'untrust-user',
  'restrict-user',
  'unrestrict-user',
  'ban-user',
  'unban-user',
];
const settingsActions = ['update-setting'];

const actionGroups = [
  { label: '全部', value: 'all' },
  { label: '登录注册', value: 'auth' },
  { label: '限制封禁', value: 'moderation' },
  { label: '系统设置', value: 'settings' },
  { label: '自定义', value: 'custom' },
];

const customActionOptions = [
  { label: '登录', value: 'login' },
  { label: '注册', value: 'register' },
  { label: '退出登录', value: 'logout' },
  { label: '发送验证码', value: 'otp' },
  { label: '重置密码', value: 'reset_password' },
  { label: '信任用户', value: 'trust-user' },
  { label: '取消信任', value: 'untrust-user' },
  { label: '限制用户', value: 'restrict-user' },
  { label: '取消限制', value: 'unrestrict-user' },
  { label: '封禁用户', value: 'ban-user' },
  { label: '取消封禁', value: 'unban-user' },
  { label: '更新设置', value: 'update-setting' },
];

type ActionGroup = 'all' | 'auth' | 'moderation' | 'settings' | 'custom';

function sameActions(left: string[], right: string[]) {
  return (
    left.length === right.length && left.every((value) => right.includes(value))
  );
}

function resolveActionGroup(value: string[]): ActionGroup {
  if (value.length === 0) return 'all';
  if (sameActions(value, authActions)) return 'auth';
  if (sameActions(value, moderationActions)) return 'moderation';
  if (sameActions(value, settingsActions)) return 'settings';
  return 'custom';
}

const selectedActionGroup = ref<ActionGroup>(resolveActionGroup(actions.value));

function changeActionGroup(value: string) {
  const group = value as ActionGroup;
  selectedActionGroup.value = group;
  if (group === 'custom') return;

  actions.value =
    group === 'auth'
      ? [...authActions]
      : group === 'moderation'
        ? [...moderationActions]
        : group === 'settings'
          ? [...settingsActions]
          : [];
  emit('search');
}

function changeCustomAction(value: string | number | null) {
  if (typeof value !== 'string') return;
  actions.value = [value];
  emit('search');
}

function changeCreatedRange(value: [number, number] | null) {
  createdRange.value = value;
  emit('search');
}

watch(actions, (value) => {
  selectedActionGroup.value = resolveActionGroup(value);
});
</script>

<template>
  <div class="filters">
    <FilterRow label="操作者">
      <n-input
        v-model:value="actor"
        class="user-input"
        clearable
        placeholder="操作者用户名"
        @change="$emit('search')"
      >
        <template #suffix>
          <n-icon :component="SearchOutlined" />
        </template>
      </n-input>
    </FilterRow>

    <FilterRow label="目标用户">
      <n-input
        v-model:value="target"
        class="user-input"
        clearable
        placeholder="目标用户名"
        @change="$emit('search')"
      />
    </FilterRow>

    <FilterRow label="事件">
      <FilterChoiceGroup
        :value="selectedActionGroup"
        :options="actionGroups"
        @update:value="changeActionGroup"
      />
      <div v-if="selectedActionGroup === 'custom'" class="custom-actions">
        <n-select
          class="custom-action-select"
          :value="actions.length === 1 ? actions[0] : null"
          :options="customActionOptions"
          placeholder="选择具体事件"
          @update:value="changeCustomAction"
        />
      </div>
    </FilterRow>

    <FilterRow label="时间">
      <TimeRangeFilter
        :model-value="createdRange"
        @update:model-value="changeCreatedRange"
      />
    </FilterRow>
  </div>
</template>

<style scoped>
.filters {
  display: grid;
  width: 100%;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
}

.user-input {
  width: min(400px, 100%);
}

.custom-actions {
  margin-top: 12px;
}

.custom-action-select {
  width: min(280px, 100%);
}
</style>
