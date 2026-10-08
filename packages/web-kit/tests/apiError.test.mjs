import assert from 'node:assert/strict';
import test from 'node:test';
import { registerHooks } from 'node:module';
import ky from 'ky';

import { getApiErrorMessage } from '../src/utils/apiError.ts';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      specifier === '../utils/apiError' &&
      context.parentURL?.endsWith('/src/auth/client.ts')
    ) {
      return nextResolve('../utils/apiError.ts', context);
    }
    return nextResolve(specifier, context);
  },
});

const { createApiClient } = await import('../src/auth/client.ts');

function responseWith(body) {
  return { response: { text: async () => body } };
}

test('reads message, error and detail from a JSON body', async () => {
  assert.equal(
    await getApiErrorMessage(
      responseWith('{"message":"用户名已存在"}'),
      '兜底',
    ),
    '用户名已存在',
  );
  assert.equal(
    await getApiErrorMessage(responseWith('{"error":"拒绝访问"}'), '兜底'),
    '拒绝访问',
  );
  assert.equal(
    await getApiErrorMessage(responseWith('{"detail":"请求过于频繁"}'), '兜底'),
    '请求过于频繁',
  );
});

test('prefers message over error and detail', async () => {
  assert.equal(
    await getApiErrorMessage(
      responseWith('{"message":"第一","error":"第二","detail":"第三"}'),
      '兜底',
    ),
    '第一',
  );
});

test('accepts a JSON string body and a plain text body', async () => {
  assert.equal(
    await getApiErrorMessage(responseWith('"服务不可用"'), '兜底'),
    '服务不可用',
  );
  assert.equal(
    await getApiErrorMessage(responseWith('Bad Gateway'), '兜底'),
    'Bad Gateway',
  );
});

test('falls back when the body is empty or unrecognized', async () => {
  assert.equal(await getApiErrorMessage(responseWith(''), '兜底'), '兜底');
  assert.equal(
    await getApiErrorMessage(responseWith('{"code":500}'), '兜底'),
    '兜底',
  );
});

test('falls back when reading the body throws', async () => {
  const reason = {
    response: {
      text: async () => {
        throw new Error('body already consumed');
      },
    },
  };
  assert.equal(await getApiErrorMessage(reason, '兜底'), '兜底');
});

test('uses the error message, then the fallback', async () => {
  assert.equal(
    await getApiErrorMessage(new Error('网络中断'), '兜底'),
    '网络中断',
  );
  assert.equal(await getApiErrorMessage(undefined, '兜底'), '兜底');
  assert.equal(await getApiErrorMessage('boom', '兜底'), '兜底');
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
  assert.ok(error instanceof Error);
  assert.equal(error.response.bodyUsed, true);
  assert.equal(await getApiErrorMessage(error, '兜底'), '用户名已存在');
});

test('client and helper share error details and status fallback', async () => {
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
  ]) {
    const client = createApiClient('https://example.invalid/').extend({
      fetch: async () =>
        new Response(body, {
          status: 400,
          headers: { 'Content-Type': contentType },
        }),
    });
    const error = await client.get('test').catch((error) => error);
    assert.ok(error instanceof Error);
    assert.equal(error.message, expected);
    assert.equal(await getApiErrorMessage(error, '兜底'), expected);
  }
});

test('prefers parsed data and leaves a readable response intact', async () => {
  const response = new Response('{"message":"响应正文"}');
  assert.equal(
    await getApiErrorMessage(
      { data: { message: '已解析文案' }, response },
      '兜底',
    ),
    '已解析文案',
  );
  assert.equal(await getApiErrorMessage({ response }, '兜底'), '响应正文');
  assert.equal(await getApiErrorMessage({ response }, '兜底'), '响应正文');
  assert.equal(response.bodyUsed, false);
});
