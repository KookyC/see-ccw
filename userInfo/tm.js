// ==UserScript==
// @name         CCW 角色信息面板
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  在 ccw.site 获取 vm，显示并修改所有角色信息，支持导出造型 SVG
// @author       you
// @match        https://www.ccw.site/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

const _fetch = window.fetch;
window.fetch = function (input, init) {
  let url = input instanceof Request ? input.url
          : input instanceof URL ? input.href
          : String(input);
  const fullUrl = new URL(url, window.location.href).href;

  if (fullUrl.startsWith('https://community-web.ccw.site/students/self/detail/')) {
    console.warn('[fetch 已拦截]', fullUrl);
    return Promise.resolve(new Response('{}', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
  }
  return _fetch.apply(this, [input, init]);
};

const _XHR = window.XMLHttpRequest;
window.XMLHttpRequest = function () {
  const xhr = new _XHR();
  const _open = xhr.open;
  const _send = xhr.send;

  xhr.open = function (method, url, ...rest) {
    this.__url = new URL(url, window.location.href).href;
    this.__method = method;
    return _open.apply(xhr, [method, url, ...rest]);
  };

  xhr.send = function (body) {
    if (this.__url.startsWith('https://community-web.ccw.site/students/self/detail/')) {
      console.warn('[XHR 已拦截]', this.__method, this.__url);
      setTimeout(() => {
        Object.defineProperty(xhr, 'readyState', { value: 4, configurable: true });
        Object.defineProperty(xhr, 'status', { value: 200, configurable: true });
        Object.defineProperty(xhr, 'responseText', { value: '{}', configurable: true });
        Object.defineProperty(xhr, 'response', { value: '{}', configurable: true });
        xhr.dispatchEvent(new Event('readystatechange'));
        xhr.dispatchEvent(new Event('load'));
      }, 0);
      return;
    }
    return _send.apply(xhr, [body]);
  };

  return xhr;
};
