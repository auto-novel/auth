<script setup lang="ts">
import { toast } from 'vue-sonner';
import { Api } from '../data/api';
import { Validator } from './util';

interface Props {
  app: string;
}

const props = defineProps<Props>();
const emits = defineEmits<{ success: [] }>();

const step = ref<'email' | 'profile'>('email');
const email = ref('');
const otp = ref('');
const username = ref('');
const password = ref('');
const loading = ref(false);

async function register() {
  if (loading.value) return;
  loading.value = true;
  try {
    await Api.register({
      app: props.app,
      username: username.value,
      password: password.value,
      email: email.value,
      otp: otp.value,
    });
    emits('success');
  } catch (error) {
    toast.error(`注册失败: ${error}`);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="flex w-auto flex-col gap-4">
    <StepIndicator
      :steps="['验证邮箱', '设置账号']"
      :current="step === 'email' ? 1 : 2"
    />

    <!--
      Both steps stay mounted (`v-show`) so returning to step 1 keeps the same
      Turnstile widget instead of rendering a new one.
    -->
    <StepEmailOtp
      v-show="step === 'email'"
      v-model:email="email"
      v-model:otp="otp"
      type="verify"
      action="signup"
      @next="step = 'profile'"
    />

    <form
      v-show="step === 'profile'"
      class="flex w-auto flex-col gap-2"
      novalidate
      @submit.prevent="register"
    >
      <FormItem :rules="Validator.validateUsername">
        <Input placeholder="用户名" v-model="username" />
      </FormItem>

      <FormItem :rules="Validator.validatePassword">
        <Input type="password" placeholder="密码" v-model="password" />
      </FormItem>

      <button
        type="button"
        class="text-primary cursor-pointer text-left text-sm font-bold"
        :disabled="loading"
        @click="step = 'email'"
      >
        ← 返回上一步
      </button>

      <Button
        type="submit"
        text="注册"
        :loading="loading"
        :disabled="loading"
      />
    </form>
  </div>
</template>
