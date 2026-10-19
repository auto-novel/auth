<script setup lang="ts">
import { XSlider } from '@novelia/web-kit';
import { ref } from 'vue';
import ComponentPage from './ComponentPage.vue';

const value = ref(0);
const decimalValue = ref(0.5);
const volume = ref(60);
const budget = ref(1200);
const warmth = ref(30);
const zoom = ref(50);
const changeCount = ref(0);
const lastChangedValue = ref<number>();

const percent = (value: number) => `${value}%`;
const yuan = (value: number) => `¥${value}`;

const code = `<XSlider v-model="value" name="volume" aria-label="音量" />

<XSlider
  v-model="volume"
  :marks="{ 0: '静音', 50: '中', 100: '最大' }"
  snap-to-marks
  tooltip="always"
  :format-value="percent"
  aria-label="音量"
/>

<XSlider v-model="warmth" orientation="vertical" :marks="{ 0: '冷', 100: '暖' }" />

<XSlider
  v-model="decimalValue"
  :min="0"
  :max="1"
  :step="0.1"
  size="sm"
  tone="danger"
  @commit="onChange"
/>`;

function onChange(value: number) {
  changeCount.value += 1;
  lastChangedValue.value = value;
}
</script>

<template>
  <ComponentPage
    title="滑块 · XSlider"
    description="用数字 v-model 绑定数值，支持横向与竖向、反向、刻度吸附、数值气泡、尺寸与色调。"
    :code="code"
  >
    <section aria-labelledby="test-slider" class="border-t border-divider pt-6">
      <h2 id="test-slider" class="mb-2 font-medium">基本用法与禁用</h2>
      <p class="mb-4 text-sm text-muted">
        拖动滑块或使用方向键调节；默认范围为 0–100，步长为 1。未绑定值时滑块停在
        min，不会写回数值。
      </p>
      <div class="grid gap-6 sm:grid-cols-2">
        <label class="flex flex-col gap-2 text-sm text-muted">
          音量 · {{ value }}
          <XSlider v-model="value" name="volume" aria-label="音量" />
        </label>
        <label class="flex flex-col gap-2 text-sm text-muted">
          禁用 · {{ value }}
          <XSlider v-model="value" disabled aria-label="禁用音量" />
        </label>
      </div>
    </section>
    <section
      aria-labelledby="test-slider-tooltip"
      class="border-t border-divider pt-6"
    >
      <h2 id="test-slider-tooltip" class="mb-3 font-medium">
        数值气泡与格式化
      </h2>
      <p class="mb-4 text-sm text-muted">
        tooltip 为 true 时悬停或聚焦显示，为 always 时常显；formatValue
        同时决定气泡文案与 aria-valuetext。
      </p>
      <div class="grid max-w-md gap-6">
        <label class="flex flex-col gap-2 text-sm text-muted">
          预算 · {{ yuan(budget) }}
          <XSlider
            v-model="budget"
            :min="0"
            :max="3000"
            :step="100"
            tooltip="always"
            :format-value="yuan"
            aria-label="预算"
          />
        </label>
        <label class="flex flex-col gap-2 text-sm text-muted">
          音量 · {{ volume }}%
          <XSlider
            v-model="volume"
            tooltip
            :format-value="percent"
            aria-label="音量"
          />
        </label>
      </div>
    </section>
    <section
      aria-labelledby="test-slider-marks"
      class="border-t border-divider pt-6"
    >
      <h2 id="test-slider-marks" class="mb-3 font-medium">刻度与吸附</h2>
      <p class="mb-4 text-sm text-muted">
        marks 的键为刻度值、值为文案；开启 snapToMarks
        后拖动与键盘调整都会吸附到最近刻度。
      </p>
      <label class="flex max-w-md flex-col gap-2 text-sm text-muted">
        音量 · {{ volume }}%
        <XSlider
          v-model="volume"
          :marks="{ 0: '静音', 50: '中', 100: '最大' }"
          snap-to-marks
          tooltip="always"
          :format-value="percent"
          aria-label="带刻度的音量"
        />
      </label>
    </section>
    <section
      aria-labelledby="test-slider-orientation"
      class="border-t border-divider pt-6"
    >
      <h2 id="test-slider-orientation" class="mb-3 font-medium">竖向与反向</h2>
      <p class="mb-4 text-sm text-muted">
        orientation 切换方向；inverted
        让数值从右到左或从上到下增长，刻度会同步镜像。
      </p>
      <div class="flex items-start gap-24">
        <div class="flex flex-col items-start gap-3 pl-16 text-sm text-muted">
          <XSlider
            v-model="warmth"
            orientation="vertical"
            :marks="{ 0: '冷', 100: '暖' }"
            tooltip="always"
            :format-value="percent"
            aria-label="色温"
          />
          色温 · {{ warmth }}%
        </div>
        <div class="flex flex-col items-start gap-3 pl-16 text-sm text-muted">
          <XSlider
            v-model="volume"
            orientation="vertical"
            inverted
            :marks="{ 0: '小', 100: '大' }"
            tooltip="always"
            :format-value="percent"
            aria-label="反向音量"
          />
          反向 · {{ volume }}%
        </div>
        <label class="flex flex-1 flex-col gap-2 text-sm text-muted">
          横向反向 · {{ zoom }}%
          <XSlider
            v-model="zoom"
            inverted
            :marks="[0, 50, 100]"
            aria-label="反向缩放"
          />
        </label>
      </div>
    </section>
    <section
      aria-labelledby="test-slider-size"
      class="border-t border-divider pt-6"
    >
      <h2 id="test-slider-size" class="mb-3 font-medium">尺寸与色调</h2>
      <p class="mb-4 text-sm text-muted">
        size 控制轨道与滑块大小，tone 切换主题色；可用 ui 对
        root、track、range、thumb、markTick、markLabel、tooltip 覆盖 class。
      </p>
      <div class="grid max-w-md gap-5">
        <label class="flex flex-col gap-2 text-xs text-muted">
          sm
          <XSlider v-model="zoom" size="sm" aria-label="小尺寸" />
        </label>
        <label class="flex flex-col gap-2 text-xs text-muted">
          md
          <XSlider v-model="zoom" size="md" aria-label="中尺寸" />
        </label>
        <label class="flex flex-col gap-2 text-xs text-muted">
          lg · danger
          <XSlider v-model="zoom" size="lg" tone="danger" aria-label="大尺寸" />
        </label>
        <label class="flex flex-col gap-2 text-xs text-muted">
          muted
          <XSlider v-model="zoom" tone="muted" aria-label="低强调" />
        </label>
      </div>
    </section>
    <section
      aria-labelledby="test-slider-decimal"
      class="border-t border-divider pt-6"
    >
      <h2 id="test-slider-decimal" class="mb-3 font-medium">
        小数步长与 commit
      </h2>
      <label class="flex max-w-sm flex-col gap-2 text-sm text-muted">
        精细调节 · {{ decimalValue.toFixed(1) }}
        <XSlider
          v-model="decimalValue"
          :min="0"
          :max="1"
          :step="0.1"
          aria-label="精细调节"
          @commit="onChange"
        />
      </label>
      <p class="mt-3 text-xs text-muted" aria-live="polite">
        commit 次数：{{ changeCount }} · 最近提交值：{{
          lastChangedValue ?? '尚未提交'
        }}
      </p>
    </section>
    <section class="border-t border-divider pt-6">
      <h2 class="mb-3 font-medium">接口与交互</h2>
      <p class="text-sm leading-6 text-muted">
        v-model 默认为 0；min、max、step 默认分别为 0、100、1。disabled
        禁用交互，name 会额外渲染一个仅屏幕阅读器可见的 number
        输入框，表单内外都能随表单提交。使用 label 或 aria-label
        为滑块命名。v-model 在拖动时实时更新；commit
        在拖动结束或键盘调节提交时触发，携带提交值。
      </p>
    </section>
  </ComponentPage>
</template>
