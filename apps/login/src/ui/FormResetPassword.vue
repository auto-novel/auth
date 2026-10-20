<script setup lang="ts">
import { toast } from 'vue-sonner';
import FormItem from '../components/FormItem.vue';
import { Api } from '../data/api';
import { Validator } from './util';

const emits = defineEmits<{ success: [] }>();

const step = ref<'email' | 'password'>('email');
const email = ref('');
const otp = ref('');
const password = ref('');
const loading = ref(false);
const passwordItem = ref<InstanceType<typeof FormItem> | null>(null);

async function resetPassword() {
  if (loading.value) return;
  if (!passwordItem.value?.validate()) return;
  loading.value = true;
  try {
    await Api.resetPassword({
      email: email.value,
      password: password.value,
      otp: otp.value,
    });
    emits('success');
  } catch (error) {
    toast.error(`重置密码失败: ${error}`);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="flex w-auto flex-col gap-4">
    <StepIndicator
      :steps="['验证邮箱', '设置新密码']"
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
      type="reset_password"
      action="password_reset"
      @next="step = 'password'"
    />

    <form
      v-show="step === 'password'"
      class="flex w-auto flex-col gap-2"
      novalidate
      @submit.prevent="resetPassword"
    >
      <FormItem ref="passwordItem" :rules="Validator.validatePassword">
        <Input type="password" placeholder="新密码" v-model="password" />
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
        text="重置密码"
        :loading="loading"
        :disabled="loading"
      />
    </form>
  </div>
</template>
