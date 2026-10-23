<script setup lang="ts">
import {
  getApiErrorMessage,
  Toast,
  XAsyncContent,
  XButton,
  XConfirmDialog,
  XSwitch,
} from '@novelia/web-kit';
import { computed, onMounted, ref } from 'vue';

import { useAdminApi, type AuthSettings } from '@/api';

const api = useAdminApi();
const settings = ref<AuthSettings | null>(null);
const registerEnabled = ref(true);
const resetPasswordEnabled = ref(true);
const loading = ref(true);
const saving = ref(false);
const loadError = ref('');
const showDisableConfirmation = ref(false);

const hasChanges = computed(() => {
  if (!settings.value) return false;
  return (
    registerEnabled.value !== settings.value.registerEnabled ||
    resetPasswordEnabled.value !== settings.value.resetPasswordEnabled
  );
});

const disabledFeatures = computed(() => {
  const disabled: string[] = [];
  if (settings.value?.registerEnabled && !registerEnabled.value) {
    disabled.push('用户注册');
  }
  if (settings.value?.resetPasswordEnabled && !resetPasswordEnabled.value) {
    disabled.push('密码重置');
  }
  return disabled;
});

const updatedAt = computed(() => {
  if (!settings.value?.updatedAt) return '尚未修改';
  const date = new Date(settings.value.updatedAt);
  if (Number.isNaN(date.getTime())) return settings.value.updatedAt;
  if (date.getUTCFullYear() <= 1) return '尚未修改';
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone: 'Asia/Shanghai',
  }).format(date);
});

function applySettings(nextSettings: AuthSettings) {
  settings.value = nextSettings;
  registerEnabled.value = nextSettings.registerEnabled;
  resetPasswordEnabled.value = nextSettings.resetPasswordEnabled;
}

async function loadSettings() {
  loading.value = true;
  loadError.value = '';

  try {
    applySettings(await api.admin.getAuthSettings());
  } catch (error) {
    settings.value = null;
    loadError.value = getApiErrorMessage(error, '无法加载设置');
  } finally {
    loading.value = false;
  }
}

async function saveSettings() {
  if (saving.value || !hasChanges.value) return;
  saving.value = true;

  await Toast.promise(
    api.admin
      .updateAuthSettings({
        registerEnabled: registerEnabled.value,
        resetPasswordEnabled: resetPasswordEnabled.value,
      })
      .then((nextSettings) => {
        applySettings(nextSettings);
        showDisableConfirmation.value = false;
      }),
    {
      loading: '正在保存设置',
      success: '设置已保存',
      error: '设置保存失败',
    },
  ).finally(() => {
    saving.value = false;
  });
}

function requestSave() {
  if (saving.value || !hasChanges.value) return;
  if (disabledFeatures.value.length > 0) {
    showDisableConfirmation.value = true;
    return;
  }
  void saveSettings();
}

function confirmDisable() {
  void saveSettings();
}

function resetDraft() {
  if (saving.value) return;
  if (settings.value) applySettings(settings.value);
}

onMounted(loadSettings);
</script>

<template>
  <main class="settings-page">
    <section class="intro" aria-labelledby="settings-title">
      <div>
        <h1 id="settings-title" class="intro-title text-ink">系统设置</h1>
        <p class="m-0 text-muted">控制用户可使用的认证功能。</p>
      </div>
      <span v-if="settings" class="updated-at text-muted">
        最近更新：{{ updatedAt }}
      </span>
    </section>

    <div class="settings-content">
      <XAsyncContent
        :loading="loading"
        :error="loadError"
        error-title="系统设置加载失败"
        retry-label="重新加载"
        :on-retry="loadSettings"
      >
        <section
          v-if="settings"
          class="flex flex-col rounded-[3px] bg-surface px-6 py-5"
        >
          <div class="setting-row">
            <div class="setting-copy">
              <strong class="text-ink">允许用户注册</strong>
              <p class="m-0 text-muted">
                关闭后，新用户无法请求注册验证码或创建账号。
              </p>
            </div>
            <XSwitch
              v-model="registerEnabled"
              :disabled="saving"
              aria-label="允许用户注册"
            />
          </div>

          <div class="setting-row">
            <div class="setting-copy">
              <strong class="text-ink">允许用户重置密码</strong>
              <p class="m-0 text-muted">
                关闭后，用户无法请求重置验证码或提交新密码。
              </p>
            </div>
            <XSwitch
              v-model="resetPasswordEnabled"
              :disabled="saving"
              aria-label="允许用户重置密码"
            />
          </div>

          <div class="actions">
            <XButton
              color="neutral"
              variant="outline"
              :disabled="!hasChanges || saving"
              @click="resetDraft"
            >
              撤销修改
            </XButton>
            <XButton
              color="danger"
              :loading="saving"
              :disabled="!hasChanges"
              @click="requestSave"
            >
              保存设置
            </XButton>
          </div>
        </section>
      </XAsyncContent>
    </div>

    <XConfirmDialog
      v-model:open="showDisableConfirmation"
      title="确认关闭认证功能"
      :description="`保存后将立即关闭${disabledFeatures.join('和')}，相关请求会被拒绝。`"
      confirm-label="确认关闭"
      :loading="saving"
      danger
      @confirm="confirmDisable"
    />
  </main>
</template>

<style scoped>
.settings-page {
  max-width: 760px;
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.intro {
  min-height: 52px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}
.intro-title {
  display: block;
  margin: 0 0 5px;
  font-size: 22px;
  line-height: 1.35;
  font-weight: 650;
}
.updated-at {
  flex-shrink: 0;
  margin-top: 6px;
  white-space: nowrap;
  font-size: 12px;
}
.settings-content {
  min-height: 180px;
}
.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  padding: 20px 0;
  border-bottom: 1px solid var(--color-divider);
}
.setting-row:first-child {
  padding-top: 4px;
}
.setting-copy {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
}

@media (max-width: 599px) {
  .settings-page {
    gap: 16px;
  }
  .intro {
    flex-direction: column;
    gap: 4px;
  }
  .updated-at {
    margin-top: 0;
    white-space: normal;
  }
  .setting-row {
    gap: 20px;
  }
}
</style>
