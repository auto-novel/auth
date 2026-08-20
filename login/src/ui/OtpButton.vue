<script setup lang="ts">
import { toast } from 'vue-sonner';
import { Api, type OtpType } from '../data/api';

interface Props {
  type: OtpType;
  email: string;
  round?: string;
  class?: string;
}

const props = defineProps<Props>();

const countdown = ref(0);

function startCountdown() {
  countdown.value = 60;
  const interval = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value -= 1;
    } else {
      clearInterval(interval);
    }
  }, 1000);
}

function requestOtp(event: MouseEvent) {
  event.preventDefault();

  if (Api.requestOtp.isPending || countdown.value > 0) return;
  Api.requestOtp({ email: props.email, type: props.type })
    .then(() => {
      toast.success('验证码已发送到您的邮箱');
      startCountdown();
    })
    .catch((error) => {
      toast.error(`验证码发送失败: ${error}`);
      startCountdown();
    });
}
</script>

<template>
  <Button
    :disabled="Api.requestOtp.isPending || countdown > 0"
    :text="countdown > 0 ? `${countdown}秒冷却` : '发送验证码'"
    :round="props.round"
    :class="props.class"
    @click="requestOtp"
  />
</template>
