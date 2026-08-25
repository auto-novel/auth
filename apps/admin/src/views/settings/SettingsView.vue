<script setup lang="ts">
import { useAdminKit } from '@novelia/admin-kit';
import {
  getAuthSettings,
  updateAuthSettings,
  type AuthSettings,
} from '@novelia/auth-api';
import {
  NAlert,
  NButton,
  NCard,
  NModal,
  NSpace,
  NSpin,
  NSwitch,
  NText,
} from 'naive-ui';
import { computed, onMounted, ref } from 'vue';

const { session } = useAdminKit();
const settings = ref<AuthSettings | null>(null);
const registerEnabled = ref(true);
const resetPasswordEnabled = ref(true);
const loading = ref(true);
const saving = ref(false);
const loadError = ref('');
const saveError = ref('');
const saveSucceeded = ref(false);
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
  saveError.value = '';
  saveSucceeded.value = false;

  try {
    applySettings(await getAuthSettings(session));
  } catch (error) {
    settings.value = null;
    loadError.value = error instanceof Error ? error.message : String(error);
  } finally {
    loading.value = false;
  }
}

async function saveSettings() {
  saving.value = true;
  saveError.value = '';
  saveSucceeded.value = false;

  try {
    const nextSettings = await updateAuthSettings(session, {
      registerEnabled: registerEnabled.value,
      resetPasswordEnabled: resetPasswordEnabled.value,
    });
    applySettings(nextSettings);
    saveSucceeded.value = true;
  } catch (error) {
    saveError.value = error instanceof Error ? error.message : String(error);
  } finally {
    saving.value = false;
  }
}

function requestSave() {
  saveError.value = '';
  saveSucceeded.value = false;
  if (disabledFeatures.value.length > 0) {
    showDisableConfirmation.value = true;
    return;
  }
  void saveSettings();
}

function confirmDisable() {
  showDisableConfirmation.value = false;
  void saveSettings();
}

function resetDraft() {
  if (settings.value) applySettings(settings.value);
  saveError.value = '';
  saveSucceeded.value = false;
}

onMounted(loadSettings);
</script>

<template>
  <main class="settings-page">
    <section class="intro" aria-labelledby="settings-title">
      <div>
        <n-text id="settings-title" tag="h1" class="intro-title">
          系统设置
        </n-text>
        <n-text depth="3">控制用户可使用的认证功能。</n-text>
      </div>
      <n-text v-if="settings" depth="3" class="updated-at">
        最近更新：{{ updatedAt }}
      </n-text>
    </section>

    <n-alert v-if="loadError" type="error" title="系统设置加载失败">
      <n-space vertical size="small">
        <n-text>{{ loadError }}</n-text>
        <n-button size="small" @click="loadSettings">重新加载</n-button>
      </n-space>
    </n-alert>

    <n-spin v-else :show="loading" class="settings-content">
      <n-card v-if="settings" :bordered="false" class="settings-card">
        <div class="setting-row">
          <div class="setting-copy">
            <n-text strong>允许用户注册</n-text>
            <n-text depth="3">
              关闭后，新用户无法请求注册验证码或创建账号。
            </n-text>
          </div>
          <n-switch
            v-model:value="registerEnabled"
            :disabled="saving"
            aria-label="允许用户注册"
          />
        </div>

        <div class="setting-row">
          <div class="setting-copy">
            <n-text strong>允许用户重置密码</n-text>
            <n-text depth="3">
              关闭后，用户无法请求重置验证码或提交新密码。
            </n-text>
          </div>
          <n-switch
            v-model:value="resetPasswordEnabled"
            :disabled="saving"
            aria-label="允许用户重置密码"
          />
        </div>

        <n-alert v-if="saveError" type="error" title="设置保存失败">
          {{ saveError }}
        </n-alert>
        <n-alert v-if="saveSucceeded" type="success" title="设置已保存" />

        <div class="actions">
          <n-button :disabled="!hasChanges || saving" @click="resetDraft">
            撤销修改
          </n-button>
          <n-button
            type="error"
            :loading="saving"
            :disabled="!hasChanges"
            @click="requestSave"
          >
            保存设置
          </n-button>
        </div>
      </n-card>
    </n-spin>

    <n-modal
      v-model:show="showDisableConfirmation"
      preset="dialog"
      type="warning"
      title="确认关闭认证功能"
      positive-text="确认关闭"
      negative-text="取消"
      :mask-closable="false"
      @positive-click="confirmDisable"
    >
      保存后将立即关闭{{ disabledFeatures.join('和') }}，相关请求会被拒绝。
    </n-modal>
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
.settings-card :deep(.n-card__content) {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  padding: 20px 0;
  border-bottom: 1px solid var(--n-border-color);
}
.setting-row:first-child {
  padding-top: 4px;
}
.setting-copy {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.settings-card .n-alert {
  margin-top: 20px;
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
