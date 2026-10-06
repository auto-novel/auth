<script setup lang="ts">
import { toast } from 'vue-sonner';
import { Api } from '../data/api';
import { Validator } from './util';

interface Emits {
  openLoginForm: [];
}

const emits = defineEmits<Emits>();

const step = ref<'email' | 'password'>('email');
const email = ref('');
const otp = ref('');
const password = ref('');
const loading = ref(false);

function resetPassword(event: MouseEvent) {
  event.preventDefault();

  if (Api.resetPassword.isPending) return;
  loading.value = true;
  Api.resetPassword({
    email: email.value,
    password: password.value,
    otp: otp.value,
  })
    .then(() => {
      loading.value = false;
      toast.success('重置密码成功');
      emits('openLoginForm');
    })
    .catch((error) => {
      loading.value = false;
      toast.error(`重置密码失败: ${error}`);
    });
}
</script>

<template>
  <div class="flex w-auto flex-col gap-4">
    <StepIndicator
      :steps="['验证邮箱', '设置新密码']"
      :current="step === 'email' ? 1 : 2"
    />

    <StepEmailOtp
      v-if="step === 'email'"
      v-model:email="email"
      v-model:otp="otp"
      type="reset_password"
      action="password_reset"
      @next="step = 'password'"
    />

    <form v-else class="flex w-auto flex-col gap-2" novalidate>
      <FormItem :rules="Validator.validatePassword">
        <Input type="password" placeholder="新密码" v-model="password" />
      </FormItem>

      <button
        type="button"
        class="text-primary cursor-pointer text-left text-sm font-bold"
        @click="step = 'email'"
      >
        ← 返回上一步
      </button>

      <Button text="重置密码" :loading="loading" @click="resetPassword" />
    </form>
  </div>
</template>
