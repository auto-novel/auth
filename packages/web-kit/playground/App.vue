<script setup lang="ts">
import {
  WidgetsOutlined,
  HomeOutlined,
  OpenInNewOutlined,
  PaletteOutlined,
  PersonOutlined,
  ReportOutlined,
} from '@vicons/material';
import {
  WebKitApp,
  WebKitLayout,
  XButton,
  type WebKitMenuOption,
} from '@novelia/web-kit';
import { RouterLink, useRoute } from 'vue-router';

const route = useRoute();

const navigationOptions: WebKitMenuOption[] = [
  { key: 'home', label: '首页', icon: HomeOutlined, to: '/' },
  { key: 'theme', label: '主题测试', icon: PaletteOutlined, to: '/theme' },
  {
    key: 'component-pages',
    type: 'group',
    label: '组件',
    icon: WidgetsOutlined,
    children: [
      { key: 'components', label: '基础组件总览 Overview', to: '/components' },
      {
        key: 'components-toast',
        label: '通知 Toast',
        to: '/components/toast',
      },
      {
        key: 'components-drawer',
        label: '抽屉 Drawer',
        to: '/components/drawer',
      },
      {
        key: 'components-select',
        label: '选择器 Select',
        to: '/components/select',
      },
      {
        key: 'components-slider',
        label: '滑块 Slider',
        to: '/components/slider',
      },
      {
        key: 'components-switch',
        label: '开关 Switch',
        to: '/components/switch',
      },
      {
        key: 'components-aspect-ratio',
        label: '宽高比 Aspect Ratio',
        to: '/components/aspect-ratio',
      },
      {
        key: 'components-action-menu',
        label: '菜单与确认框 Action Menu & Confirm Dialog',
        to: '/components/action-menu',
      },
      {
        key: 'components-pagination',
        label: '分页 Pagination',
        to: '/components/pagination',
      },
      {
        key: 'components-async-content',
        label: '异步内容 Async Content',
        to: '/components/async-content',
      },
    ],
  },
  {
    key: 'account',
    type: 'group',
    label: '账号',
    icon: PersonOutlined,
    children: [
      {
        key: 'profile',
        label: '个人资料',
        icon: PersonOutlined,
        to: '/profile',
      },
    ],
  },
  { key: 'divider', type: 'divider' },
  {
    key: 'docs',
    type: 'external',
    label: 'Vite 文档',
    icon: OpenInNewOutlined,
    href: 'https://cn.vite.dev/',
  },
];

const accountOptions: WebKitMenuOption[] = [
  {
    key: 'resources',
    type: 'group',
    label: '相关链接',
    icon: HomeOutlined,
    children: [
      {
        key: 'strikes',
        label: '处罚记录',
        icon: ReportOutlined,
        to: '/strikes',
      },
      {
        key: 'docs-new-tab',
        type: 'external',
        label: 'Vite 文档',
        icon: OpenInNewOutlined,
        href: 'https://cn.vite.dev/',
        target: '_blank',
      },
    ],
  },
];
</script>

<template>
  <WebKitApp>
    <WebKitLayout
      :navigation-options="navigationOptions"
      :account-options="accountOptions"
      :selected-navigation-key="String(route.name ?? '')"
    >
      <template #header-actions>
        <XButton
          :as="RouterLink"
          to="/theme"
          variant="toolbar"
          size="icon"
          aria-label="主题测试"
          title="主题测试"
        >
          <PaletteOutlined class="size-5" aria-hidden="true" />
        </XButton>
      </template>
      <RouterView />
    </WebKitLayout>
  </WebKitApp>
</template>
