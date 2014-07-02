/**
 * @name ipc-events (main)
 * @description Event emitter that communicate with other process through IPC.
 * @author Nicolas Tallefourtane <dev@nicolab.net>
 * @link https://github.com/Nicolab/node-ipc-events
 * @license MIT https://github.com/Nicolab/node-ipc-events/blob/master/LICENSE
 */

/**
 * IpcEvents
 * @param {ChildProcess} proc ChildProcess object
 *
 * @constructor
 * @api public
 */
function IpcEvents(proc) {
  var _this = this;

  this.process = proc;
  this._events = {};

  this.process.on('message', function(data) {
    _this._eventHandler(data);
  });
}

/**
 * Register a new event listener for the given IPC event.
 *
 * @param {string} event      Name of the IPC event.
 * @param {function} fn       Callback function.
 * @return {IpcEvents}
 * @api public
 */
IpcEvents.prototype.on = function on(event, fn) {

  if (!this._events[event]) {
    this._events[event] = [];
  }

  this._events[event].push(fn);

  return this;
};

/**
 * Add an event listener that's only called once.
 *
 * @param {string} event      Name of the IPC event.
 * @param {function} fn        Callback function.
 * @return {IpcEvents}
 * @api public
 */
IpcEvents.prototype.once = function once(event, fn) {
  fn._IPCE_once = true;
  return this.on(event, fn);
}

/**
 * Send an IPC event to all registered (other process) event listeners.
 * @param  {string} event Name of the event.
 * @param  {object} data  Data to send to other process via IPC
 * @return {IpcEvents}
 * @api public
 */
IpcEvents.prototype.send = function send(event, data) {

  data              = data || {};
  data._IPCE_event  = event;

  this.process.send(data);

  return this;
};

/**
 * Get a list of assigned event listeners.
 *
 * @param {string} event The events that should be listed.
 * @return {array}
 * @api public
 */
IpcEvents.prototype.listeners = function listeners(event) {
  return this._events[event] || [];
};

/**
 * Remove event listeners.
 *
 * @param {string}    event The event we want to remove.
 * @param {function}  fn    The listener that we need to find.
 * @return {IpcEvents}
 * @api public
 */
IpcEvents.prototype.removeListener = function removeListener(event, fn) {

  if (!this._events[event]) {
    return this;
  }

  for (var i = 0, length = this._events[event].length; i < length; i++) {
    if (this._events[event][i] === fn) {
      this._events[event][i] = null;
      delete this._events[event][i];
    }
  }

  return this;
};

/**
 * Handles IPC events
 * @param  {object} data Data sent by the IPC emitter
 * @private
 */
IpcEvents.prototype._eventHandler = function _eventHandler(data) {

  data = data || {};

  if(!this._events[data._IPCE_event]) {
    return;
  }

  var ev = data._IPCE_event;

  data._IPCE_event = null;

  delete data._IPCE_event;

  for(var i in this._events[ev]) {

    var fn = this._events[ev][i];

    if (fn._IPCE_once) {
      this.removeListener(ev, fn);
    }

    fn(data);
  }
};


/*----------------------------------------------------------------------------*\
  Expose
\*----------------------------------------------------------------------------*/

/**
 * Expose IpcEvents
 * @type {IpcEvents}
 */
module.exports = IpcEvents;
