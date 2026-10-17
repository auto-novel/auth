import assert from 'node:assert/strict';

export const file = (size = 100) =>
  new File([new Uint8Array(size)], 'file.txt');

export function mockXHR(t) {
  const previous = Object.getOwnPropertyDescriptor(
    globalThis,
    'XMLHttpRequest',
  );
  const instances = [];
  class XHR {
    upload = { onprogress: null };
    onload = null;
    onerror = null;
    ontimeout = null;
    onabort = null;
    status = 0;
    statusText = '';
    response = new Blob();
    responseHeaders = '';
    headers = {};
    abortCalls = 0;
    constructor() {
      instances.push(this);
    }
    open(...args) {
      this.openArgs = args;
    }
    setRequestHeader(name, value) {
      this.headers[name] = value;
    }
    getAllResponseHeaders() {
      return this.responseHeaders;
    }
    send(body) {
      this.body = body;
    }
    abort() {
      this.abortCalls++;
      this.onabort?.();
    }
    progress(loaded, total = 100, lengthComputable = true) {
      this.upload.onprogress?.({ loaded, total, lengthComputable });
    }
    respond(status = 200, body = '', headers = '') {
      this.status = status;
      this.response = body instanceof Blob ? body : new Blob([body]);
      this.responseHeaders = headers;
      this.onload?.();
    }
  }
  Object.defineProperty(globalThis, 'XMLHttpRequest', {
    configurable: true,
    value: XHR,
  });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'XMLHttpRequest', previous);
    else delete globalThis.XMLHttpRequest;
  });
  return instances;
}

export function assertClean(xhr) {
  for (const key of ['onload', 'onerror', 'ontimeout', 'onabort'])
    assert.equal(xhr[key], null);
  assert.equal(xhr.upload.onprogress, null);
}
