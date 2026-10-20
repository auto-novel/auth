import assert from 'node:assert/strict';
import test from 'node:test';

import { componentPages } from '../playground/componentPages.ts';

test('playground pages share unique route identities and English alphabetical order', () => {
  assert.deepEqual(
    componentPages.map((page) => page.englishName),
    [
      'AspectRatio',
      'AsyncContent',
      'ConfirmDialog',
      'Dialog',
      'Drawer',
      'DropdownMenu',
      'DropZone',
      'Input',
      'Pagination',
      'ScrollArea',
      'Select',
      'Separator',
      'Slider',
      'Switch',
      'Tabs',
      'Toast',
    ],
  );
  assert.equal(
    new Set(componentPages.map((page) => page.to)).size,
    componentPages.length,
  );
  assert.equal(
    new Set(componentPages.map((page) => page.name)).size,
    componentPages.length,
  );
  for (const page of componentPages) {
    assert.equal(page.to, `/components/${page.slug}`);
    assert.equal(page.name, `components-${page.slug}`);
    assert.equal(typeof page.component, 'function');
    assert.ok(page.label && page.title && page.description);
  }
});
