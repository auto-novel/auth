import assert from 'node:assert/strict';
import test from 'node:test';
import ky, { HTTPError, TimeoutError } from 'ky';

import {
  getApiErrorDetail,
  getApiErrorMessage,
} from '../src/utils/apiError.ts';
import { createApiClient } from '../src/api/client.ts';

function httpError(status = 400) {
  return new HTTPError(
    new Response(null, { status }),
    new Request('https://example.invalid/test'),
    {},
  );
}

test('synchronously extracts message, error and detail from parsed data', () => {
  for (const [data, expected] of [
    [{ message: ' 用户名已存在 ' }, '用户名已存在'],
    [{ error: '拒绝访问' }, '拒绝访问'],
    [{ detail: '请求过于频繁' }, '请求过于频繁'],
    [{ message: '第一', error: '第二', detail: '第三' }, '第一'],
    [{ message: ' ', error: 500, detail: '第三' }, '第三'],
  ]) {
    assert.equal(getApiErrorDetail(data), expected);
    assert.equal(getApiErrorMessage({ data }, '兜底'), expected);
  }
});

test('accepts JSON object strings, JSON strings and plain text data', () => {
  for (const [data, expected] of [
    ['{"message":"用户名已存在"}', '用户名已存在'],
    ['{"error":"拒绝访问"}', '拒绝访问'],
    ['{"detail":"请求过于频繁"}', '请求过于频繁'],
    ['"服务不可用"', '服务不可用'],
    [' Bad Gateway ', 'Bad Gateway'],
  ]) {
    assert.equal(getApiErrorDetail(data), expected);
    assert.equal(getApiErrorMessage({ data }, '兜底'), expected);
  }
});

test('falls back for empty, non-string or unrecognized data', () => {
  for (const data of [
    undefined,
    null,
    '',
    ' ',
    500,
    false,
    [],
    {},
    { code: 500 },
    { message: 500, error: null, detail: false },
    '{"code":500}',
    'null',
    '500',
    'true',
  ]) {
    assert.equal(getApiErrorDetail(data), undefined);
    assert.equal(getApiErrorMessage({ data }, '兜底'), '兜底');
  }
});

test('filters HTML from details, Error messages and fallback text', () => {
  for (const html of [
    '<!DOCTYPE html>',
    '<html><body>Bad Gateway</body></html>',
    '<!-- gateway error -->',
    '失败 <BR /> 请重试',
    '</div>',
  ]) {
    assert.equal(getApiErrorDetail(html), undefined);
    assert.equal(getApiErrorDetail({ message: html }), undefined);
    assert.equal(getApiErrorMessage({ data: html }, '兜底'), '兜底');
    assert.equal(getApiErrorMessage(new Error(html), '兜底'), '兜底');
    assert.equal(getApiErrorMessage(undefined, html), '请求失败');
  }
  assert.equal(
    getApiErrorDetail({ message: '<h1>错误</h1>', error: '可展示文案' }),
    '可展示文案',
  );
  assert.equal(
    getApiErrorDetail('数值 1 < 2，重试 > 0'),
    '数值 1 < 2，重试 > 0',
  );
});

test('limits messages to 200 characters with an ellipsis only when needed', () => {
  const exact = '错'.repeat(200);
  const long = '错'.repeat(201);
  const expected = `${'错'.repeat(199)}…`;
  assert.equal(getApiErrorDetail(exact), exact);
  assert.equal(getApiErrorDetail(long), expected);
  assert.equal(getApiErrorDetail({ detail: ` ${long} ` }), expected);
  assert.equal(getApiErrorMessage({ data: long }, '兜底'), expected);
  assert.equal(getApiErrorMessage(new Error(long), '兜底'), expected);
  assert.equal(getApiErrorMessage(undefined, long), expected);
  assert.equal(
    getApiErrorDetail(`${'错'.repeat(198)} ${'尾'.repeat(5)}`),
    `${'错'.repeat(198)}…`,
  );
});

test('uses parsed data before Error messages and HTTP/timeout fallbacks', () => {
  const error = new Error('网络中断');
  error.data = { message: '业务详情' };
  assert.equal(getApiErrorMessage(error, '兜底'), '业务详情');
  assert.equal(getApiErrorMessage(new Error(' 网络中断 '), '兜底'), '网络中断');
  assert.equal(getApiErrorMessage(new Error(''), '兜底'), '兜底');
  assert.equal(getApiErrorMessage(undefined, ' 兜底 '), '兜底');
  assert.equal(getApiErrorMessage('boom', '兜底'), '兜底');
  assert.equal(getApiErrorMessage(undefined, ' '), '请求失败');

  for (const status of [400, 401, 503]) {
    assert.equal(
      getApiErrorMessage(httpError(status), '兜底'),
      `请求失败[${status}]`,
    );
  }
  const timeout = new TimeoutError(new Request('https://example.invalid/test'));
  assert.equal(getApiErrorMessage(timeout, '兜底'), '请求超时，请稍后再试');
  for (const reason of [httpError(), timeout]) {
    reason.data = { detail: '业务详情' };
    assert.equal(getApiErrorMessage(reason, '兜底'), '业务详情');
  }
});

test('never reads or clones the response body, with or without parsed data', () => {
  const response = new Response('{"message":"响应正文"}');
  let bodyReads = 0;
  for (const method of ['text', 'json', 'clone']) {
    response[method] = () => {
      bodyReads++;
      throw new Error('response must not be read');
    };
  }
  assert.equal(
    getApiErrorMessage({ data: { message: '已解析文案' }, response }, '兜底'),
    '已解析文案',
  );
  assert.equal(getApiErrorMessage({ response }, '兜底'), '兜底');
  assert.equal(getApiErrorMessage({ response }, '兜底'), '兜底');
  assert.equal(response.bodyUsed, false);
  assert.equal(bodyReads, 0);

  const reason = {
    data: { message: '已解析文案' },
    get response() {
      throw new Error('response must not be accessed when data is available');
    },
  };
  assert.equal(getApiErrorMessage(reason, '兜底'), '已解析文案');
});

test('contains throwing getters and proxies without replacing the fallback', () => {
  const throwing = () => {
    throw new Error('getter failed');
  };
  const malformedData = Object.defineProperty({}, 'message', { get: throwing });
  assert.equal(getApiErrorDetail(malformedData), undefined);
  assert.equal(getApiErrorMessage({ data: malformedData }, '兜底'), '兜底');

  const messageError = Object.defineProperty(new Error('original'), 'message', {
    get: throwing,
  });
  const statusError = httpError();
  Object.defineProperty(statusError, 'response', { get: throwing });
  const statusGetterError = httpError();
  Object.defineProperty(statusGetterError.response, 'status', {
    get: throwing,
  });
  for (const reason of [
    Object.defineProperty({}, 'data', { get: throwing }),
    Object.defineProperty({}, 'name', { get: throwing }),
    new Proxy({}, { has: throwing }),
    messageError,
    statusError,
    statusGetterError,
  ]) {
    assert.equal(getApiErrorMessage(reason, '兜底'), '兜底');
  }
});

test('does not rewrite or otherwise mutate the original error or parsed data', () => {
  const data = Object.freeze({ message: '业务详情' });
  const error = httpError();
  error.data = data;
  Object.freeze(error);
  const before = Object.getOwnPropertyDescriptors(error);
  assert.equal(getApiErrorMessage(error, '兜底'), '业务详情');
  assert.deepEqual(Object.getOwnPropertyDescriptors(error), before);
  assert.equal(error.data, data);
  assert.match(error.message, /^Request failed with status code 400/);
});

test('uses parsed ky data after the response body is consumed', async () => {
  const client = ky.create({
    retry: 0,
    fetch: async () =>
      new Response(JSON.stringify({ message: '用户名已存在' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }),
  });
  const error = await client
    .get('https://example.invalid/test')
    .catch((error) => error);
  assert.ok(error instanceof HTTPError);
  assert.equal(error.response.bodyUsed, true);
  assert.equal(getApiErrorMessage(error, '兜底'), '用户名已存在');
});

test('client preserves the native error while the helper extracts details or status', async () => {
  for (const [body, contentType, expected] of [
    [
      '{"message":"第一","error":"第二","detail":"第三"}',
      'application/json',
      '第一',
    ],
    ['{"error":"拒绝访问"}', 'application/json', '拒绝访问'],
    ['{"detail":"请求过于频繁"}', 'application/json', '请求过于频繁'],
    ['"服务不可用"', 'application/json', '服务不可用'],
    [' Bad Gateway ', 'text/plain', 'Bad Gateway'],
    ['{"code":400}', 'application/json', '请求失败[400]'],
    ['', 'text/plain', '请求失败[400]'],
    ['<html>Bad Gateway</html>', 'text/html', '请求失败[400]'],
  ]) {
    const client = createApiClient('https://example.invalid/').extend({
      fetch: async () =>
        new Response(body, {
          status: 400,
          headers: { 'Content-Type': contentType },
        }),
    });
    const error = await client.get('test').catch((error) => error);
    assert.ok(error instanceof HTTPError);
    const originalMessage = error.message;
    const before = Object.getOwnPropertyDescriptors(error);
    assert.match(originalMessage, /^Request failed with status code 400/);
    assert.equal(getApiErrorMessage(error, '兜底'), expected);
    assert.equal(error.message, originalMessage);
    assert.deepEqual(Object.getOwnPropertyDescriptors(error), before);
  }
});
