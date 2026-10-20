import assert from 'node:assert/strict';
import test from 'node:test';
import {
  handleMarkdownLinkPaste,
  insertMarkdownText,
} from '../../src/ui/markdown/editing.ts';

test('paste escapes labels and URL parentheses, normalizes HTTP(S) URLs', () => {
  for (const [label, url, expected] of [
    [
      String.raw`名称 [附录] \ 路径`,
      '  HTTPS://example.com/a(b)  ',
      String.raw`[名称 \[附录\] \\ 路径](https://example.com/a%28b%29)`,
    ],
    ['文字', 'http://example.com', '[文字](http://example.com/)'],
  ]) {
    const { element, event } = editor();
    element.value = label;
    element.selectionStart = 0;
    element.selectionEnd = label.length;
    event.clipboardData.getData = () => url;
    assert.equal(handleMarkdownLinkPaste(event, element), true);
    assert.equal(element.value, expected);
  }
});

function editor({ command = 'success', nativeInput = false } = {}) {
  const inputs = [];
  let rangeCalls = 0;
  const element = Object.assign(new EventTarget(), {
    value: '前文字后',
    selectionStart: 1,
    selectionEnd: 3,
    maxLength: -1,
    disabled: false,
    readOnly: false,
    focus() {
      this.ownerDocument.activeElement = this;
    },
    setRangeText(text, start, end) {
      rangeCalls++;
      replace(text, start, end);
    },
  });
  function replace(text, start, end) {
    element.value =
      element.value.slice(0, start) + text + element.value.slice(end);
    element.selectionStart = element.selectionEnd = start + text.length;
  }
  element.ownerDocument = {
    activeElement: element,
    defaultView: { Event },
    execCommand:
      command === 'missing'
        ? undefined
        : (_name, _showUI, text) => {
            if (command === 'throw') throw new Error('Unsupported');
            if (command === 'fail') return false;
            replace(text, element.selectionStart, element.selectionEnd);
            if (nativeInput)
              element.dispatchEvent(new Event('input', { bubbles: true }));
            return true;
          },
  };
  element.addEventListener('input', (event) => inputs.push(event));
  const event = Object.assign(new Event('paste', { cancelable: true }), {
    clipboardData: { getData: () => 'https://example.com' },
  });
  return { element, event, inputs, rangeCalls: () => rangeCalls };
}

test('successful paste emits input exactly once, with or without native input', () => {
  for (const nativeInput of [true, false]) {
    const { element, event, inputs, rangeCalls } = editor({ nativeInput });
    assert.equal(handleMarkdownLinkPaste(event, element), true);
    assert.equal(element.value, '前[文字](https://example.com/)后');
    assert.equal(event.defaultPrevented, true);
    assert.equal(inputs.length, 1);
    assert.equal(rangeCalls(), 0);
  }
});

test('pasting a URL over a URL replaces it verbatim, not with a Markdown link', () => {
  const { element, event } = editor();
  element.value = 'https://old.example';
  element.selectionStart = 0;
  element.selectionEnd = element.value.length;
  event.clipboardData.getData = () => '  HTTPS://new.example/a(b)  ';
  assert.equal(handleMarkdownLinkPaste(event, element), true);
  assert.equal(element.value, '  HTTPS://new.example/a(b)  ');
});

test('failed execCommand keeps paste native but allows programmatic setRangeText', () => {
  for (const command of ['missing', 'fail', 'throw']) {
    const { element, event, inputs, rangeCalls } = editor({ command });
    assert.equal(handleMarkdownLinkPaste(event, element), false);
    assert.equal(event.defaultPrevented, false);
    assert.equal(element.value, '前文字后');
    assert.equal(rangeCalls(), 0);
    assert.equal(inputs.length, 0);

    assert.equal(insertMarkdownText(element, '**文字**'), true);
    assert.equal(element.value, '前**文字**后');
    assert.equal(rangeCalls(), 1);
    assert.equal(inputs.length, 1);
  }
});

test('disabled and readonly editors reject paste and programmatic insertion', () => {
  for (const property of ['disabled', 'readOnly']) {
    const { element, event, inputs } = editor();
    element[property] = true;
    assert.equal(handleMarkdownLinkPaste(event, element), false);
    assert.equal(insertMarkdownText(element, 'text'), false);
    assert.equal(element.value, '前文字后');
    assert.equal(event.defaultPrevented, false);
    assert.equal(inputs.length, 0);
  }
});

test('maxlength counts replaced selection, permits exact fits and rejects overflow', () => {
  const { element, inputs } = editor();
  element.ownerDocument.activeElement = null;
  element.maxLength = 6;
  assert.equal(insertMarkdownText(element, 'abcd'), true);
  assert.equal(element.value, '前abcd后');
  assert.equal(insertMarkdownText(element, 'x'), false);
  assert.equal(inputs.length, 1);

  const paste = editor();
  paste.element.maxLength = '前[文字](https://example.com/)后'.length - 1;
  assert.equal(handleMarkdownLinkPaste(paste.event, paste.element), false);
  assert.equal(paste.event.defaultPrevented, false);
  assert.equal(paste.element.value, '前文字后');
  paste.element.maxLength++;
  assert.equal(handleMarkdownLinkPaste(paste.event, paste.element), true);
});

test('non-convertible, prevented, unfocused or empty paste stays native', () => {
  for (const setup of [
    ({ element }) => (element.ownerDocument.activeElement = null),
    ({ element }) => (element.selectionEnd = element.selectionStart),
    ({ element }) => (element.value = '前\n字后'),
    ({ element }) => (element.value = '前\r字后'),
    ...[
      'javascript:alert(1)',
      'ftp://example.com',
      'https://',
      'https://a b',
      'https://a\nb',
    ].map(
      (url) =>
        ({ event }) =>
          (event.clipboardData.getData = () => url),
    ),
    ({ event }) => (event.clipboardData = null),
    ({ event }) => (event.clipboardData.getData = () => 'ordinary text'),
    ({ event }) => event.preventDefault(),
  ]) {
    const state = editor();
    setup(state);
    const { element, event, inputs } = state;
    const value = element.value;
    const prevented = event.defaultPrevented;
    assert.equal(handleMarkdownLinkPaste(event, element), false);
    assert.equal(event.defaultPrevented, prevented);
    assert.equal(element.value, value);
    assert.equal(inputs.length, 0);
  }
  assert.equal(handleMarkdownLinkPaste(editor().event, null), false);
});
