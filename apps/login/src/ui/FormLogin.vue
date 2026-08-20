<script setup lang="ts">
import { toast } from 'vue-sonner';
import { Api } from '../data/api';
import { onLoginSuccess } from './util';

interface Props {
  app: string;
}
interface Emits {
  openResetPasswordForm: [];
}

const props = defineProps<Props>();
const emits = defineEmits<Emits>();

const username = ref('');
const password = ref('');
const loading = ref(false);

function login(event: MouseEvent) {
  event.preventDefault();

  if (Api.login.isPending) return;
  loading.value = true;
  Api.login({
    app: props.app,
    username: username.value,
    password: password.value,
  })
    .then(() => {
      loading.value = false;
      onLoginSuccess();
    })
    .catch((error) => {
      loading.value = false;
      toast.error(`登录失败: ${error}`);
    });
}
</script>

<template>
  <form class="flex w-auto flex-col gap-2" novalidate>
    <FormItem>
      <Input placeholder="用户名/邮箱" v-model="username" />
    </FormItem>
    <FormItem>
      <Input type="password" placeholder="密码" v-model="password" />
    </FormItem>

    <button
      type="button"
      class="text-primary cursor-pointer text-right text-sm font-bold"
      @click="() => emits('openResetPasswordForm')"
    >
      忘记密码？
    </button>

    <Button type="submit" :loading="loading" text="登录" @click="login" />
  </form>
</template>
