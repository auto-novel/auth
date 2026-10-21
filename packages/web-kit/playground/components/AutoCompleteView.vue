<script setup lang="ts">
import { XAutoComplete, type XAutoCompleteOption } from '@novelia/web-kit';
import { ref } from 'vue';
import ComponentPage from './ComponentPage.vue';

const value = ref('');
const selected = ref('');
const options: XAutoCompleteOption[] = [
  { value: 'vue', label: 'Vue · 渐进式框架' },
  { value: 'typescript', label: 'TypeScript · 类型系统' },
  { value: 'vite', label: 'Vite · 构建工具' },
  { value: 'legacy', label: '旧版本（不可选）', disabled: true },
];
const email = ref('');
const code = `<XAutoComplete
  v-model="value"
  :options="['Vue', 'TypeScript', 'Vite']"
  placeholder="选择建议或自由输入"
  aria-label="技术关键词"
  clearable
/>`;
</script>

<template>
  <ComponentPage
    title="自动补全 · XAutoComplete"
    description="字符串输入与候选建议，可自由输入，支持键盘导航和中文输入。"
    :code="code"
  >
    <section class="border-t border-divider pt-6">
      <h2 class="mb-3 font-medium">候选过滤与自由输入</h2>
      <div class="max-w-md space-y-3">
        <label for="autocomplete-tech" class="block text-sm">技术关键词</label>
        <XAutoComplete
          id="autocomplete-tech"
          v-model="value"
          name="technology"
          :options="options"
          placeholder="试试输入 v，或输入列表以外的内容"
          clearable
          @select="selected = $event.value"
        >
          <template #option="{ option }">
            <span class="min-w-0 truncate">{{ option.label }}</span>
          </template>
        </XAutoComplete>
        <p class="text-xs text-muted">
          当前输入：{{ value || '（空）' }} · 最近选择：{{
            selected || '（无）'
          }}
        </p>
        <p class="text-sm text-muted">
          ↑ / ↓ 导航，Enter 选中，Escape 关闭；失焦不会丢失自由输入。
        </p>
      </div>
    </section>
    <section class="border-t border-divider pt-6">
      <h2 class="mb-3 font-medium">动态候选（不做二次过滤）</h2>
      <div class="max-w-md space-y-3">
        <XAutoComplete
          v-model="email"
          aria-label="邮箱建议"
          placeholder="输入邮箱前缀"
          :filter="false"
          :options="
            email
              ? ['gmail.com', 'outlook.com'].map(
                  (domain) => `${email.split('@')[0]}@${domain}`,
                )
              : []
          "
          clearable
        />
        <XAutoComplete
          model-value="只读内容"
          :options="options"
          readonly
          aria-label="只读示例"
        />
        <XAutoComplete
          model-value="禁用内容"
          :options="options"
          disabled
          aria-label="禁用示例"
        />
      </div>
    </section>
    <section class="border-t border-divider pt-6">
      <h2 class="mb-3 font-medium">接口约定</h2>
      <p class="text-sm leading-6 text-muted">
        v-model 始终为字符串，选择后写入 option.value 而非 label。options
        支持字符串或 { value, label?, disabled? }，value 必须非空且唯一。默认按
        label/value 忽略大小写匹配； filter 可传自定义函数，远程搜索可用
        :filter="false" 配合 @search 更新候选。 @select 返回候选对象并把焦点交回
        输入框，@clear 通知清空。候选为空且未输入时不展示弹层，输入后无匹配展示
        emptyText（自定义 empty 插槽时仍会展示）。支持
        sm/md/lg、invalid、readonly、disabled； prefix、suffix、option 和 empty
        插槽可自定义内容。class/style 用于外层，原生属性及事件交给 input； ui
        可覆盖输入框与弹层各部位。组件引用提供 input、focus、blur、select。
      </p>
    </section>
  </ComponentPage>
</template>
