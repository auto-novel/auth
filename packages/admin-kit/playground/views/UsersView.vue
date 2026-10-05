<script setup lang="ts">
import type { DataTableColumns } from 'naive-ui';
import { NButton, NDataTable, NTag } from 'naive-ui';
import { h } from 'vue';

interface Row {
  id: number;
  username: string;
  role: string;
  signedIn: boolean;
}

const columns: DataTableColumns<Row> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '用户名', key: 'username' },
  {
    title: '角色',
    key: 'role',
    render: (row) =>
      h(
        NTag,
        { type: row.role === 'admin' ? 'success' : 'default', size: 'small' },
        { default: () => row.role },
      ),
  },
  {
    title: '操作',
    key: 'actions',
    render: () =>
      h(
        NButton,
        { size: 'small', onClick: () => window.alert('静态示例，不连云上数据') },
        { default: () => '查看' },
      ),
  },
];

const data: Row[] = [
  { id: 1, username: 'fishhawk', role: 'admin', signedIn: true },
  { id: 2, username: 'reader', role: 'user', signedIn: false },
  { id: 3, username: 'guest', role: 'user', signedIn: false },
];
</script>

<template>
  <n-data-table :columns="columns" :data="data" :bordered="false" />
</template>
