<script setup lang="ts">
import { toast } from 'vue-sonner';
import { Api } from '../data/api';
import { Validator, onLoginSuccess } from './util';

interface Props {
  app: string;
}

const props = defineProps<Props>();

const username = ref('');
const password = ref('');
const email = ref('');
const otp = ref('');
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
  <form class="flex w-auto flex-col gap-2" novalidate>
    <FormItem :rules="Validator.validateUsername">
      <Input placeholder="用户名" v-model="username" />
    </FormItem>

    <FormItem :rules="Validator.validatePassword">
      <Input type="password" placeholder="密码" v-model="password" />
    </FormItem>

    <FormItem :rules="Validator.validateEmail">
      <Input placeholder="邮箱" v-model="email" />
    </FormItem>

    <FormItem :rules="Validator.validateOtpVerify">
      <Input round="left" placeholder="邮箱验证码" v-model="otp" />
      <OtpButton :email="email" type="verify" round="right" class="flex-1/2" />
    </FormItem>

    <p class="mt-1 text-left text-xs text-[#8d8d8d] select-none">
      * 收不到验证邮件的话，记得看垃圾箱
    </p>

    <Button text="注册" :loading="loading" @click="register" />
  </form>
</template>
