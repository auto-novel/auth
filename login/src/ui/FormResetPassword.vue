<script setup lang="ts">
import { toast } from 'vue-sonner';
import { Api } from '../data/api';
import { Validator } from './util';

interface Emits {
  openLoginForm: [];
}

const emits = defineEmits<Emits>();

const password = ref('');
const email = ref('');
const otp = ref('');
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
  <form class="flex w-auto flex-col gap-2" novalidate>
    <FormItem :rules="Validator.validateEmail">
      <Input placeholder="邮箱" v-model="email" />
    </FormItem>

    <FormItem :rules="Validator.validateOtpResetPassword">
      <Input round="left" placeholder="邮箱验证码" v-model="otp" />
      <OtpButton
        :email="email"
        type="reset_password"
        round="right"
        class="flex-1/2"
      />
    </FormItem>

    <FormItem :rules="Validator.validatePassword">
      <Input type="password" placeholder="新密码" v-model="password" />
    </FormItem>

    <p class="mt-1 text-left text-xs text-[#8d8d8d] select-none">
      * 收不到验证邮件的话，记得看垃圾箱
    </p>

    <Button text="重置密码" :loading="loading" @click="resetPassword" />
  </form>
</template>
