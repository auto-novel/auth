<script setup lang="ts">
import { toast } from 'vue-sonner';
import { Api } from '../data/api';
import { Validator, onLoginSuccess } from './util';

interface Props {
  app: string;
}

const props = defineProps<Props>();

const step = ref<'email' | 'profile'>('email');
const email = ref('');
const otp = ref('');
const username = ref('');
const password = ref('');
const loading = ref(false);

function register(event: MouseEvent) {
  event.preventDefault();

  if (Api.register.isPending) return;
  loading.value = true;
  Api.register({
    app: props.app,
    username: username.value,
    password: password.value,
    email: email.value,
    otp: otp.value,
  })
    .then(() => {
      loading.value = false;
      onLoginSuccess();
    })
    .catch((error) => {
      loading.value = false;
      toast.error(`注册失败: ${error}`);
    });
}
</script>

<template>
  <div class="flex w-auto flex-col gap-4">
    <StepIndicator
      :steps="['验证邮箱', '设置账号']"
      :current="step === 'email' ? 1 : 2"
    />

    <StepEmailOtp
      v-if="step === 'email'"
      v-model:email="email"
      v-model:otp="otp"
      type="verify"
      action="signup"
      @next="step = 'profile'"
    />

    <form v-else class="flex w-auto flex-col gap-2" novalidate>
      <FormItem :rules="Validator.validateUsername">
        <Input placeholder="用户名" v-model="username" />
      </FormItem>

      <FormItem :rules="Validator.validatePassword">
        <Input type="password" placeholder="密码" v-model="password" />
      </FormItem>

      <button
        type="button"
        class="text-primary cursor-pointer text-left text-sm font-bold"
        @click="step = 'email'"
      >
        ← 返回上一步
      </button>

      <Button text="注册" :loading="loading" @click="register" />
    </form>
  </div>
</template>
