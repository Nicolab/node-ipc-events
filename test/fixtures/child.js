/**
 * @name Unit tests of ipc-events (fixture)
 * @author Nicolas Tallefourtane <dev@nicolab.net>
 * @link https://github.com/Nicolab/node-ipc-events
 * @license MIT https://github.com/Nicolab/node-ipc-events/blob/master/LICENSE
 */

var test      = require('unit.js');
var IpcEvents = require('../../');
var ipc       = new IpcEvents(process);
var masterReady;

if(typeof describe !== 'undefined') {
  throw new Error('child.js file is a fixture that must be executed ' +
    'in a subshell, should not run directly with the tests runner');
}

// on ready state
process.on('message', function(data){

  if(data && data.ready) {

    test.string(data.ready)
      .isIdenticalTo('master');

    masterReady = true;
  }
});

// delay max to process the ready state
setTimeout(function(){

  if(!masterReady) {
    throw new Error('The child process has not received the ready state ' +
      'of the master process');
  }
}, 20);

test
  .function(IpcEvents)
      .hasName('IpcEvents')

  .object(ipc)
    .isInstanceOf(IpcEvents)
;


/*----------------------------------------------------------------------------*\
  Events
\*----------------------------------------------------------------------------*/

// should be never called
ipc.on('never-called', function(){
  throw new Error('"nerver-called" event is called on IPC child.');
});

ipc.on('ping', function(data) {

  test.object(data);

  ipc.send('pong', {
    data: data
  });
});

ipc.on('ping-once', function(data) {

  test.object(data);

  ipc.send('pong-once', {
    data: data
  });
});


//----------------------------------------------------------------------------//

// send ready state
process.send({ ready: 'child' });
