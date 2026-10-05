<script setup lang="ts">
import { NButton, NCard, NForm, NFormItem, NInput, NSwitch } from 'naive-ui';
import { ref } from 'vue';

const siteName = ref('认证服务');
const allowRegister = ref(true);
</script>

<template>
  <n-card title="系统设置">
    <n-form label-placement="left" label-width="120">
      <n-form-item label="站点名称">
        <n-input v-model:value="siteName" />
      </n-form-item>
      <n-form-item label="开放注册">
        <n-switch v-model:value="allowRegister" />
      </n-form-item>
      <n-form-item label="操作">
        <n-button
          type="primary"
          @click="window.alert('静态示例，不会提交到后端')"
        >
          保存
        </n-button>
      </n-form-item>
    </n-form>
  </n-card>
</template>
