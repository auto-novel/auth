<script setup lang="ts">
import { useWebKit } from '@novelia/web-kit';

const { whoami } = useWebKit();
</script>

<template>
  <div class="page-container flex flex-col gap-6 py-6">
    <section class="border-divider border-b pb-6">
      <h1 class="mb-2 text-lg font-medium">web-kit playground</h1>
      <p class="text-muted text-sm">
        这里以源码方式引入
        <code>@novelia/web-kit</code>
        ，改
        <code>packages/web-kit/src</code>
        下的组件或 CSS 会立即热更新，不需要先 build，也不需要宿主应用。
      </p>
    </section>

    <section class="border-divider border-b pb-6">
      <h2 class="mb-3 font-medium">会话</h2>
      <p class="text-sm">
        登录状态：{{
          whoami.isSignedIn ? (whoami.user?.username ?? '已登录') : '未登录'
        }}
      </p>
      <p class="text-muted mt-1 text-xs">
        auth.url 指向相对地址
        <code>/auth</code>
        ，playground 里不会有真实会话，用来验证未登录态的表现。
      </p>
    </section>

    <section class="border-divider border-b pb-6">
      <h2 class="mb-3 font-medium">长内容（验证布局内滚动）</h2>
      <p v-for="index in 40" :key="index" class="text-muted py-1 text-sm">
        第 {{ index }} 行
      </p>
    </section>
  </div>
</template>
