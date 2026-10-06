<script setup lang="ts">
import { toast } from 'vue-sonner';
import { Api, type OtpType } from '../data/api';

interface Props {
  type: OtpType;
  email: string;
  /** Current Turnstile token, read-only here; `Turnstile` is its only writer. */
  token: string;
  round?: string;
  class?: string;
}

const props = defineProps<Props>();

interface Emits {
  /** Asks the parent to reset the Turnstile widget for the next send. */
  reset: [];
}

const emits = defineEmits<Emits>();

const countdown = ref(0);
const sending = ref(false);

// A send needs both an available cooldown slot and a Turnstile token. A failed
// widget never produces a token, so the empty check already covers it.
const pending = computed(() => countdown.value > 0 || !props.token);

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

async function requestOtp(event: MouseEvent) {
  event.preventDefault();

  if (sending.value || Api.requestOtp.isPending || pending.value) return;
  sending.value = true;
  try {
    await Api.requestOtp({
      email: props.email,
      type: props.type,
      turnstileToken: props.token,
    });
    toast.success('验证码已发送到您的邮箱');
    startCountdown();
  } catch (error) {
    toast.error(`验证码发送失败: ${error}`);
  } finally {
    sending.value = false;
    // Every completed request may have consumed the token.
    emits('reset');
  }
}
</script>

<template>
  <Button
    :disabled="sending || pending"
    :loading="sending"
    :text="countdown > 0 ? `${countdown}秒冷却` : '发送验证码'"
    :round="props.round"
    :class="props.class"
    @click="requestOtp"
  />
</template>
