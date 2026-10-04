import assert from 'node:assert/strict';
import test from 'node:test';

import { getApiErrorMessage } from '../src/utils/apiError.ts';

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
