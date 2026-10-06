<script setup lang="ts">
import FormItem from '../components/FormItem.vue';
import Turnstile from '../components/Turnstile.vue';
import type { OtpType } from '../data/api';
import { Validator } from './util';

/**
 * Shared first step of the register and reset-password flows: it collects the
 * email address and its one-time code, then hands off to the rest of the form.
 */
interface Props {
  /** Which one-time-code flow to request; also selects the code format. */
  type: OtpType;
  /** Turnstile action for this surface; validated server-side via siteverify. */
  action: string;
  submitText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  submitText: '下一步',
});

const email = defineModel<string>('email', { required: true });
const otp = defineModel<string>('otp', { required: true });

interface Emits {
  /** The email and code are filled in; the parent shows the remaining form. */
  next: [];
}

const emits = defineEmits<Emits>();

const turnstileToken = ref('');
const turnstile = ref<InstanceType<typeof Turnstile> | null>(null);
const emailItem = ref<InstanceType<typeof FormItem> | null>(null);
const otpItem = ref<InstanceType<typeof FormItem> | null>(null);

const otpRules = computed(() =>
  props.type === 'verify'
    ? Validator.validateOtpVerify
    : Validator.validateOtpResetPassword,
);

function next(event: MouseEvent) {
  event.preventDefault();

  const items = [emailItem.value, otpItem.value];
  if (!items.every((item) => item?.validate())) return;
  emits('next');
}
</script>

<template>
  <form class="flex w-auto flex-col gap-2" novalidate>
    <FormItem ref="emailItem" :rules="Validator.validateEmail">
      <Input placeholder="邮箱" v-model="email" />
    </FormItem>

    <FormItem ref="otpItem" :rules="otpRules">
      <Input round="left" placeholder="邮箱验证码" v-model="otp" />
      <OtpButton
        :token="turnstileToken"
        :email="email"
        :type="props.type"
        round="right"
        class="flex-1/2"
        @reset="turnstile?.reset()"
      />
    </FormItem>

    <Turnstile
      ref="turnstile"
      v-model:token="turnstileToken"
      :action="props.action"
    />

    <p class="mt-1 text-left text-xs text-[#8d8d8d] select-none">
      * 收不到验证邮件的话，记得看垃圾箱
    </p>

    <Button type="submit" :text="props.submitText" @click="next" />
  </form>
</template>
