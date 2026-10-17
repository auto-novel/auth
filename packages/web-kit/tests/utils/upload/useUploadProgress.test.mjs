import assert from 'node:assert/strict';
import test from 'node:test';
import { isReadonly, watch } from 'vue';

import { useUploadProgress } from '../../../src/utils/upload/index.ts';
import { assertClean, file, mockXHR } from './mockXHR.mjs';

const options = { url: '/upload' };

test('仅暴露四项 API，按 File 对象去重，readonly Map 条目响应式更新', async (t) => {
  const instances = mockXHR(t);
  const a = file();
  const b = file();
  const upload = useUploadProgress([a, b, a]);
  assert.deepEqual(Object.keys(upload).sort(), [
    'cancel',
    'isUploading',
    'upload',
    'uploads',
  ]);
  assert.equal(upload.uploads.size, 2);
  assert.equal(isReadonly(upload.uploads), true);
  assert.equal(isReadonly(upload.isUploading), true);
  const initial = upload.uploads.get(a);
  assert.equal(initial.status, 'idle');
  assert.equal(initial.total, a.size);
  assert.equal(initial.loaded, 0);
  assert.ok(isReadonly(initial) || Object.isFrozen(initial));
  const values = [];
  const stop = watch(
    () => upload.uploads.get(a).progress,
    (value) => values.push(value),
    { flush: 'sync' },
  );
  t.after(stop);
  const request = upload.upload(a, options);
  instances[0].progress(50, 100);
  assert.equal(upload.uploads.get(a).status, 'uploading');
  assert.equal(upload.uploads.get(b).status, 'idle');
  assert.ok(
    isReadonly(upload.uploads.get(a)) || Object.isFrozen(upload.uploads.get(a)),
  );
  instances[0].respond(201, 'done');
  const response = await request;
  assert.ok(response instanceof Response);
  assert.equal(await response.text(), 'done');
  assert.deepEqual(values, [50, 100]);
  assert.equal(upload.uploads.get(a).status, 'success');
  assert.equal(upload.isUploading.value, false);
});

test('未知/重复活跃任务拒绝，不同文件独立并发且透传请求配置', async (t) => {
  const instances = mockXHR(t);
  const a = file();
  const b = file();
  const upload = useUploadProgress([a, b]);
  await assert.rejects(upload.upload(file(), options));
  assert.equal(instances.length, 0);
  const first = upload.upload(a, {
    url: '/raw',
    method: 'PUT',
    bodyType: 'file',
    headers: { Authorization: 'token' },
  });
  await assert.rejects(upload.upload(a, options));
  assert.equal(instances.length, 1);
  assert.deepEqual(instances[0].openArgs, ['PUT', '/raw', true]);
  assert.equal(instances[0].body, a);
  assert.deepEqual(instances[0].headers, { Authorization: 'token' });
  const second = upload.upload(b, options);
  instances[0].progress(25, 100);
  assert.equal(upload.uploads.get(a).loaded, 25);
  assert.equal(upload.uploads.get(b).loaded, 0);
  instances[0].respond();
  await first;
  assert.equal(upload.uploads.get(b).status, 'uploading');
  assert.equal(upload.isUploading.value, true);
  instances[1].respond();
  await second;
  assert.equal(upload.isUploading.value, false);
});

test('失败保留错误与进度，失败及完成后都可重试并清空 error/loaded', async (t) => {
  const instances = mockXHR(t);
  const a = file();
  const upload = useUploadProgress([a]);
  const first = upload.upload(a, options);
  instances[0].progress(25, 100);
  instances[0].onerror();
  const error = await first.catch((error) => error);
  assert.equal(error.kind, 'network');
  assert.equal(upload.uploads.get(a).status, 'error');
  assert.equal(upload.uploads.get(a).error, error);
  assert.equal(upload.uploads.get(a).loaded, 25);
  for (let index = 1; index <= 2; index++) {
    const retry = upload.upload(a, options);
    assert.equal(upload.uploads.get(a).status, 'uploading');
    assert.equal(upload.uploads.get(a).loaded, 0);
    assert.equal(upload.uploads.get(a).error, undefined);
    instances[index].respond();
    await retry;
    assert.equal(upload.uploads.get(a).status, 'success');
    assert.equal(upload.uploads.get(a).progress, 100);
  }
});

test('cancel 立即中止并允许重试，旧 catch/finally 和保存的迟到事件不污染新任务', async (t) => {
  const instances = mockXHR(t);
  const a = file();
  const upload = useUploadProgress([a]);
  const controller = new AbortController();
  const first = upload.upload(a, { ...options, signal: controller.signal });
  const rejected = assert.rejects(first, { name: 'AbortError' });
  const old = instances[0];
  const late = [
    old.upload.onprogress,
    old.onload,
    old.onerror,
    old.ontimeout,
    old.onabort,
  ];
  old.progress(20);
  upload.cancel(a);
  assert.equal(old.abortCalls, 1);
  assert.equal(upload.uploads.get(a).status, 'canceled');
  assert.equal(upload.isUploading.value, false);
  assertClean(old);

  // 不等旧 Promise 的 catch/finally，就启动下一次上传。
  const retry = upload.upload(a, options);
  const current = instances[1];
  current.progress(30);
  controller.abort();
  assert.equal(current.abortCalls, 0);
  await rejected;
  old.status = 200;
  old.response = new Blob(['old']);
  late[0]({ loaded: 100, total: 100, lengthComputable: true });
  for (const callback of late.slice(1)) callback();
  assert.equal(upload.uploads.get(a).status, 'uploading');
  assert.equal(upload.uploads.get(a).loaded, 30);
  assert.equal(upload.uploads.get(a).error, undefined);
  assert.equal(upload.isUploading.value, true);
  await assert.rejects(upload.upload(a, options));
  assert.equal(instances.length, 2);
  current.respond(200, 'new');
  assert.equal(await (await retry).text(), 'new');
  assert.equal(upload.uploads.get(a).status, 'success');
});

test('外部 signal 的预先/中途取消生效，取消后可以重试', async (t) => {
  const instances = mockXHR(t);
  const a = file();
  const upload = useUploadProgress([a]);
  for (const preAborted of [true, false]) {
    const controller = new AbortController();
    if (preAborted) controller.abort();
    const request = upload.upload(a, { ...options, signal: controller.signal });
    if (!preAborted) controller.abort();
    await assert.rejects(request, { name: 'AbortError' });
    assert.equal(upload.uploads.get(a).status, 'canceled');
    assert.equal(upload.isUploading.value, false);
    if (preAborted) assert.equal(instances.length, 0);
    else {
      assert.equal(instances[0].abortCalls, 1);
      assertClean(instances[0]);
    }
  }
  const retry = upload.upload(a, options);
  instances.at(-1).respond();
  await retry;
  assert.equal(upload.uploads.get(a).status, 'success');
});

test('取消空闲、未知或已完成文件为 no-op，未知总大小保持 null', async (t) => {
  const instances = mockXHR(t);
  const a = file();
  const upload = useUploadProgress([a]);
  const initial = upload.uploads.get(a);
  upload.cancel(a);
  upload.cancel(file());
  assert.equal(upload.uploads.get(a), initial);
  assert.equal(upload.uploads.size, 1);
  assert.equal(instances.length, 0);
  const request = upload.upload(a, options);
  instances[0].progress(50, 0, false);
  assert.equal(upload.uploads.get(a).total, null);
  assert.equal(upload.uploads.get(a).progress, null);
  assert.equal(upload.uploads.get(a).loaded, 50);
  instances[0].respond();
  await request;
  const completed = upload.uploads.get(a);
  upload.cancel(a);
  assert.equal(upload.uploads.get(a), completed);
  assert.equal(instances[0].abortCalls, 0);
  assert.equal(completed.progress, 100);
});
