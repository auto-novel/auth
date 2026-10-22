import assert from 'node:assert/strict';
import test from 'node:test';

import { buttonVariants } from '../src/ui/button/variants.ts';
import { sliderVariants } from '../src/ui/slider/variants.ts';

function classes(value) {
  return new Set(value.split(/\s+/));
}

test('Button defaults preserve theme colors and independent text utilities', () => {
  const result = classes(buttonVariants());
  for (const name of [
    'rounded-sm',
    '[--button-color:var(--color-primary)]',
    '[--button-on:var(--color-on-primary)]',
    'bg-[var(--button-color)]',
    'text-[color:var(--button-on)]',
    'hover:bg-[var(--button-hover)]',
    'min-h-10',
    'text-sm',
    'font-medium',
    'focus-visible:outline-2',
    'focus-visible:outline-[color:var(--button-color)]',
  ]) {
    assert.ok(result.has(name), name);
  }
});

test('Button caller classes override variants without dropping theme utilities', () => {
  const result = classes(
    buttonVariants({
      color: 'danger',
      size: 'sm',
      class: 'px-8 bg-paper hover:bg-primary text-lg',
    }),
  );
  for (const name of [
    'px-8',
    'bg-paper',
    'hover:bg-primary',
    'text-lg',
    'text-[color:var(--button-on)]',
    '[--button-on:var(--color-on-error)]',
  ]) {
    assert.ok(result.has(name), name);
  }
  for (const name of [
    'px-3',
    'bg-[var(--button-color)]',
    'hover:bg-[var(--button-hover)]',
    'text-sm',
  ]) {
    assert.ok(!result.has(name), name);
  }
});

test('Button colors map semantic roles independently of appearance', () => {
  for (const [color, token] of [
    ['primary', 'primary'],
    ['neutral', 'neutral'],
    ['danger', 'error'],
    ['warning', 'warning'],
  ]) {
    const result = classes(buttonVariants({ color }));
    for (const role of [
      'color',
      'on',
      'hover',
      'pressed',
      'text',
      'soft',
      'soft-hover',
      'soft-pressed',
    ]) {
      const themeToken =
        role === 'color'
          ? token
          : role === 'on'
            ? `on-${token}`
            : `${token}-${role}`;
      assert.ok(result.has(`[--button-${role}:var(--color-${themeToken})]`));
    }
  }
});

test('Button appearances consume theme states and preserve neutral overrides', () => {
  for (const variant of ['solid', 'soft', 'outline', 'ghost']) {
    const result = classes(buttonVariants({ variant }));
    const solid = variant === 'solid';
    assert.ok(
      result.has(`hover:bg-[var(--button-${solid ? 'hover' : 'soft-hover'})]`),
    );
    assert.ok(
      result.has(
        `active:bg-[var(--button-${solid ? 'pressed' : 'soft-pressed'})]`,
      ),
    );
    assert.equal(result.has('bg-[var(--button-soft)]'), variant === 'soft');
    assert.equal(result.has('border'), variant === 'outline');
    assert.ok(
      result.has(`text-[color:var(--button-${solid ? 'on' : 'text'})]`),
    );
  }
  const neutral = classes(
    buttonVariants({ color: 'neutral', variant: 'outline' }),
  );
  assert.ok(neutral.has('border-border'));
  assert.ok(neutral.has('text-muted'));
  assert.ok(!neutral.has('border-[color:var(--button-color)]/50'));
});

test('Slider orientation and size jointly determine track dimensions', () => {
  for (const [size, thickness] of [
    ['sm', '0.5'],
    ['md', '1'],
    ['lg', '1.5'],
  ]) {
    const horizontal = sliderVariants({ size });
    const vertical = sliderVariants({
      size,
      orientation: 'vertical',
      hasMarkLabels: true,
    });
    assert.ok(classes(horizontal.track()).has(`h-${thickness}`));
    assert.ok(classes(vertical.track()).has(`w-${thickness}`));
    assert.ok(classes(vertical.track()).has('h-full'));
    assert.ok(classes(vertical.root()).has('h-32'));
    assert.ok(!classes(vertical.root()).has('h-12'));
  }
  assert.ok(classes(sliderVariants().root()).has('h-6'));
  assert.ok(
    classes(sliderVariants({ hasMarkLabels: true }).root()).has('h-12'),
  );
});

test('Slider slot overrides win while preserving independent border and ring styles', () => {
  const slots = sliderVariants({ tone: 'danger', orientation: 'vertical' });
  const thumb = classes(slots.thumb({ class: 'size-6 border-muted' }));
  for (const name of [
    'size-6',
    'border-2',
    'border-muted',
    'focus-visible:ring-4',
    'focus-visible:ring-error/20',
  ]) {
    assert.ok(thumb.has(name), name);
  }
  assert.ok(!thumb.has('size-4'));
  assert.ok(!thumb.has('border-error'));
  assert.ok(classes(slots.range()).has('bg-error'));
  const root = classes(slots.root({ class: 'h-48' }));
  assert.ok(root.has('h-48'));
  assert.ok(!root.has('h-32'));
  const tooltip = classes(slots.tooltip({ class: 'text-primary text-sm' }));
  assert.ok(tooltip.has('text-primary'));
  assert.ok(tooltip.has('text-sm'));
  assert.ok(!tooltip.has('text-xs'));
  assert.ok(!tooltip.has('text-surface'));
});
