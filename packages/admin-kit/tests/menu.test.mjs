import assert from 'node:assert/strict';
import test from 'node:test';
import { createMemoryHistory, createRouter } from 'vue-router';

import { getAdminMenuActiveKey, selectAdminMenuOption } from '../src/menu.ts';

test('selection uses to or onSelect, never the menu key as a path', () => {
  const navigated = [];
  const navigate = (to) => navigated.push(to);
  const to = { name: 'users', params: { id: 7 } };
  let actions = 0;
  const action = { key: 'export', label: '导出', onSelect: () => actions++ };

  selectAdminMenuOption({ key: 0, label: '用户', to }, navigate);
  selectAdminMenuOption(action, navigate);
  selectAdminMenuOption({ ...action, disabled: true }, navigate);
  selectAdminMenuOption({ ...action, show: false }, navigate);
  selectAdminMenuOption({ key: 'group', children: [action] }, navigate);
  assert.deepEqual(navigated, [to]);
  assert.equal(actions, 1);
});

test('highlight resolves nested named routes and numeric keys, ignoring actions', () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/users/:id', name: 'users', component: {} }],
  });
  const options = [
    { key: '/users/7', label: '动作', onSelect() {} },
    { key: 'hidden', to: '/users/7', show: false },
    {
      key: 'group',
      children: [
        { key: 0, label: '用户', to: { name: 'users', params: { id: 7 } } },
      ],
    },
  ];
  assert.equal(getAdminMenuActiveKey(options, router, '/users/7'), 0);
  assert.equal(getAdminMenuActiveKey(options, router, '/users/8'), null);
});
