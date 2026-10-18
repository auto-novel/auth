import assert from 'node:assert/strict';
import test from 'node:test';

import {
  uploadFile,
  UploadError,
} from '../../../src/utils/upload/uploadFile.ts';
import { assertClean, file, mockXHR } from './mockXHR.mjs';

test('Blob 响应转换为 Response，支持正文读取、响应头和无正文状态', async (t) => {
  const instances = mockXHR(t);
  const request = uploadFile(file(), { url: '/upload' });
  const [xhr] = instances;
  assert.equal(xhr.responseType, 'blob');
  xhr.respond(
    201,
    '{"ok":true}',
    'Content-Type: application/json\r\nX-Upload: done\r\n',
  );
  const response = await request;
  assert.ok(response instanceof Response);
  assert.equal(response.status, 201);
  assert.equal(response.headers.get('x-upload'), 'done');
  assert.deepEqual(await response.json(), { ok: true });
  assertClean(xhr);

  for (const status of [204, 205, 304]) {
    const pending = uploadFile(file(), { url: '/upload' });
    instances.at(-1).respond(status, 'ignored');
    const result =
      status === 304
        ? await pending.catch((error) => {
            assert.ok(error instanceof UploadError);
            assert.equal(error.kind, 'http');
            return error.response;
          })
        : await pending;
    assert.ok(result instanceof Response);
    assert.equal(result.status, status);
    assert.equal(result.body, null);
    assert.equal(await result.text(), '');
    assertClean(instances.at(-1));
  }
});

test('默认 FormData、自定义配置和原始 File，进度仅传 loaded/total', async (t) => {
  const instances = mockXHR(t);
  const a = file();
  const events = [];
  const request = uploadFile(a, {
    url: '/upload',
    onProgress: (event) => events.push(event),
  });
  const [xhr] = instances;
  assert.deepEqual(xhr.openArgs, ['POST', '/upload', true]);
  assert.ok(xhr.body instanceof FormData);
  assert.equal(xhr.body.get('file').name, a.name);
  assert.equal(await xhr.body.get('file').text(), await a.text());
  assert.equal(xhr.withCredentials, false);
  assert.equal(xhr.timeout, 0);
  xhr.progress(25, 100);
  xhr.progress(50, 0, false);
  assert.deepEqual(events, [
    { loaded: 25, total: 100 },
    { loaded: 50, total: null },
  ]);
  xhr.respond();
  await request;

  for (const bodyType of ['form-data', 'file']) {
    const configured = uploadFile(a, {
      url: '/custom',
      method: 'PUT',
      bodyType,
      ...(bodyType === 'form-data' ? { fieldName: 'attachment' } : {}),
      headers: { Authorization: 'Bearer token' },
      withCredentials: true,
      timeout: 1000,
    });
    const current = instances.at(-1);
    assert.deepEqual(current.openArgs, ['PUT', '/custom', true]);
    assert.deepEqual(current.headers, { Authorization: 'Bearer token' });
    assert.deepEqual(
      [current.withCredentials, current.timeout, current.responseType],
      [true, 1000, 'blob'],
    );
    if (bodyType === 'file') assert.equal(current.body, a);
    else assert.equal(current.body.get('attachment').name, a.name);
    current.respond();
    await configured;
    assertClean(current);
  }
});

test('HTTP 错误保留 Response，网络/超时分类且不暴露 XHR', async (t) => {
  const instances = mockXHR(t);
  for (const [event, kind] of [
    ['onload', 'http'],
    ['onerror', 'network'],
    ['ontimeout', 'timeout'],
  ]) {
    const controller = new AbortController();
    const request = uploadFile(file(), {
      url: '/upload',
      signal: controller.signal,
    });
    const xhr = instances.at(-1);
    if (event === 'onload')
      xhr.respond(500, 'server failed', 'X-Error: failed\r\n');
    else xhr[event]();
    await assert.rejects(request, (error) => {
      assert.ok(error instanceof UploadError);
      assert.equal(error.kind, kind);
      assert.equal('xhr' in error, false);
      if (kind === 'http') {
        assert.ok(error.response instanceof Response);
        assert.equal(error.response.status, 500);
        assert.equal(error.response.headers.get('x-error'), 'failed');
      } else assert.equal(error.response, undefined);
      return true;
    });
    if (kind === 'http') {
      const error = await request.catch((error) => error);
      assert.equal(await error.response.text(), 'server failed');
    }
    assertClean(xhr);
    controller.abort();
    assert.equal(xhr.abortCalls, 0);
  }
});

test('预先取消不创建 XHR，中途取消真实 abort，结算后解绑 signal 和迟到事件', async (t) => {
  const instances = mockXHR(t);
  const before = new AbortController();
  before.abort();
  await assert.rejects(
    uploadFile(file(), { url: '/upload', signal: before.signal }),
    { name: 'AbortError' },
  );
  assert.equal(instances.length, 0);

  for (const cancel of [true, false]) {
    const controller = new AbortController();
    const events = [];
    const request = uploadFile(file(), {
      url: '/upload',
      signal: controller.signal,
      onProgress: (event) => events.push(event),
    });
    const xhr = instances.at(-1);
    const lateProgress = xhr.upload.onprogress;
    if (cancel) {
      controller.abort();
      await assert.rejects(request, { name: 'AbortError' });
      assert.equal(xhr.abortCalls, 1);
    } else {
      xhr.respond();
      await request;
      controller.abort();
      assert.equal(xhr.abortCalls, 0);
    }
    lateProgress({ loaded: 100, total: 100, lengthComputable: true });
    assert.deepEqual(events, []);
    assertClean(xhr);
  }
});

test('send 同步异常拒绝原 error 并清理监听', async (t) => {
  const instances = mockXHR(t);
  const error = new Error('send failed');
  t.mock.method(globalThis.XMLHttpRequest.prototype, 'send', () => {
    throw error;
  });
  const controller = new AbortController();
  await assert.rejects(
    uploadFile(file(), { url: '/upload', signal: controller.signal }),
    (actual) => actual === error,
  );
  assertClean(instances[0]);
  controller.abort();
  assert.equal(instances[0].abortCalls, 0);
});
