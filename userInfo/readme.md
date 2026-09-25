在ccw中，有一个API堪称诡异，这个API就是
```javascript
"https://community-web.ccw.site/students/self/detail/"
```
给大家做个演示（脚本来源于会飞的黄油）
```javascript
//演示代码
async function getMyDetail(needGrade = true, needExtraInfo = true, fields = []) {
  const response = await fetch('https://community-web.ccw.site/students/self/detail/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({
      needGrade,
      needExtraInfo,
      fields
    })
  });

  const data = await response.json();
  
  if (data.status === 200) {
    console.log('获取成功:', data.body);
    return data.body;
  } else {
    console.error('获取失败:', data.msg);
    return null;
  }
}

const me = await getMyDetail(true, true, []);
console.log('我的信息:', me);

const basic = await getMyDetail(false, false, ['name', 'avatar', 'oid']);
console.log('基础信息:', basic);
```
这个API有几个问题：1.可以直接使用fetch，安全性低，容易被利用，若电脑里有不想上学之流的木马，你的个人信息就不保了 2.过于全面，我仔细看了一下，它可以输出你的身份证号某几位（包括最后几位），姓氏，名字长度，出身日期，qq等信息
当然解决办法是有的，这串代码可以拦截相关的API：

[拦截代码](./tm.js)
```javascript
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
```
```javascript
// ==UserScript==
// @name         个人信息获取拦截
// @description  拦截恶意代码对个人信息的获取
// @author       KookyC蓝羽
// @match        https://www.ccw.site/*
// @run-at       document-start
// @grant        none
// ==/UserScript==
```