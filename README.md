# IPC event emitter

[![Actual version published on NPM](https://badge.fury.io/js/ipc-events.png)](https://www.npmjs.org/package/ipc-events)
[![npm module downloads per month](http://img.shields.io/npm/dm/ipc-events.svg)](https://www.npmjs.org/package/ipc-events)

Minimal and fast event emitter that communicate with other process through IPC.

## Getting started

### Install

```shell
npm install ipc-events --save
```

### Usage

```js
var spawn = require('child_process').spawn;
var Ipc   = require('ipc-events');

var a = new Ipc(process);
var b = new Ipc(spawn(/* some command */, {
  stdio: [null, null, null, 'ipc']
}));

a.on('say-hello', function(data) {
  console.log(data.hello); // Hello from "b"!
});

b.on('say-hello', function(data) {
  console.log(data.hello); // Hello from "a"!
});

a.send('say-hello', {
  hello: 'Hello from "a"!'
});

b.send('say-hello', {
  hello: 'Hello from "b"!'
});
```

__Listen `once'__

```js
function myCallback(data) {
  console.log(data.hello); // Hello from "a"!
}

// Add listener, defined to be triggered "once"
b.once('say-hello', myCallback);

// myCallback() is invoked and the listener is removed
a.send('say-hello', {
  hello: 'Hello from "a"!'
});

// myCallback() is not called because it is no longer listening on this event
a.send('say-hello', {
  hello: 'Hello from "a"!'
});
```

__Get all listeners of an event__

```js
console.log(a.listeners('say-hello'));
```

__Remove a listener__

```js
function myCallback(data) {
  // some code ...
}

// add
a.on('say-hello', myCallback);

// remove
a.removeListener('say-hello', myCallback);
```


## Unit tests

`ipc-events` is unit tested with [Unit.js](http://unitjs.com)

Run the tests
```shell
cd node_modules/ipc-events

npm test
```


## LICENSE

[MIT](https://github.com/Nicolab/node-ipc-events/blob/master/LICENSE) (c) 2014, Nicolas Tallefourtane.


## Author

| [![Nicolas Tallefourtane - Nicolab.net](http://www.gravatar.com/avatar/d7dd0f4769f3aa48a3ecb308f0b457fc?s=64)](http://nicolab.net) |
|---|
| [Nicolas Talle](http://nicolab.net) |
| [![Make a donation via Paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=PGRH4ZXP36GUC) |
