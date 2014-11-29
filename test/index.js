/**
 * @name Unit tests of ipc-events (main)
 * @author Nicolas Tallefourtane <dev@nicolab.net>
 * @link https://github.com/Nicolab/node-ipc-events
 * @license MIT https://github.com/Nicolab/node-ipc-events/blob/master/LICENSE
 */

var test        = require('unit.js');
var spawn       = require('child_process').spawn;
var IpcEvents   = require('../');
var testTimeout = 400;
var ipc;
var child;
var childError;

process.on('error', function() {
  child && child.kill();
});

describe('IpcEvents', function(){

  beforeEach(function(done){

    // ensures that the last test case are issued
    test.undefined(child);
    test.undefined(ipc);
    test.number(testTimeout).isIdenticalTo(400);

    // launch the child process
    child = spawn('node', [__dirname + '/fixtures/child.js'], {
      stdio: [null, null, null, 'ipc']
    });

    test.object(child);

    // child data
    child.stdout.on('data', function (data) {
      process.stdout.write('child.js process data:\n' + data.toString());
    });

    // child error
    child.stderr.on('data', function (data) {
      childError = new Error('child.js process error: \n' + data.toString());
    });

    // child message
    child.on('message', function(data){

      if(data && data.ready) {

        test.string(data.ready)
          .isIdenticalTo('child');

        ipc = new IpcEvents(child);

        // should be never called
        ipc.on('never-called', function() {
          throw new Error('"nerver-called" event is called on IPC master.');
        });

        // send ready state
        ipc.send('ready', { ready: 'master' });

        checkChild(done);
      }
    });
  });

  afterEach(function(){
    child.kill();
    child       = undefined;
    ipc         = undefined;
    testTimeout = 400;
  });

  //------------------------------------------------------------------------//

  it('should be a class', function(){

    test
      .function(IpcEvents)
        .hasName('IpcEvents')

      .object(ipc)
        .isInstanceOf(IpcEvents)

      .object(new IpcEvents(process))
        .isInstanceOf(IpcEvents)
        .isNotEqualTo(ipc)
    ;
  });

  it('`on` create a listener', function(done){

    var listener      = test.spy();
    var listenerOnce  = test.spy();

    test
      .given('listeners', function(){

        test
          .object(ipc.on('pong-once', listenerOnce))
            .isInstanceOf(IpcEvents)
            .isIdenticalTo(ipc)

          .object(ipc.on('pong', listener))
            .isInstanceOf(IpcEvents)
            .isIdenticalTo(ipc)
      })

      .when('sending events', function() {

        test
          .object(ipc.send('ping-once', { message: 'ping once'}))
            .isInstanceOf(IpcEvents)
            .isIdenticalTo(ipc)

          .object(ipc.send('ping', { message: 'ping 1'}))
            .isInstanceOf(IpcEvents)
            .isIdenticalTo(ipc)

          .object(ipc.send('ping', { message: 'ping 2'}))
            .isInstanceOf(IpcEvents)
            .isIdenticalTo(ipc)
        ;
      })

      .then('test listeners (allow time to communicate)').wait(5, function() {

        test
          .bool(listenerOnce.calledOnce)
            .isTrue()

          .object(listenerOnce.firstCall.args[0])
            .is({
              data: { message: 'ping once' }
            })

          .bool(listener.callCount === 2)
            .isTrue()

          .object(listener.firstCall.args[0])
            .is({
              data: { message: 'ping 1' }
            })

          .object(listener.secondCall.args[0])
            .is({
              data: { message: 'ping 2' }
            })
        ;

        done();
      })
    ;
  });

  it('`once` create a listener executed once', function(done){

    var listenerOnce = test.spy();
    var listener     = test.spy();

     test
      .given('listener', function(){
        test
          .object(ipc.once('pong', listenerOnce))
            .isInstanceOf(IpcEvents)
            .isIdenticalTo(ipc)

          .object(ipc.on('pong', listener))
            .isInstanceOf(IpcEvents)
            .isIdenticalTo(ipc)
        ;
      })

      .when('sending events', function() {
        test
          .object(ipc.send('ping', { message: 'ping 1'}))
            .isInstanceOf(IpcEvents)
            .isIdenticalTo(ipc)

          .object(ipc.send('ping', { message: 'ping 2'}))
            .isInstanceOf(IpcEvents)
            .isIdenticalTo(ipc)
        ;
      })

      .then('test listener (allow time to communicate)').wait(5, function() {

        test
          .bool(listenerOnce.calledOnce)
            .isTrue()

          .object(listenerOnce.firstCall.args[0])
            .is({
              data: { message: 'ping 1' }
            })

          .bool(listener.calledTwice)
            .isTrue()

          .object(listener.firstCall.args[0])
            .is({
              data: { message: 'ping 1' }
            })

          .object(listener.secondCall.args[0])
            .is({
              data: { message: 'ping 2' }
            })
        ;

        done();
      })
    ;

  });

  it('`send` an inter process event', function(done){

    var listener = test.spy();

    ipc.on('pong', listener);
    ipc.send('ping', { message: 'ping 1'});

    test.wait(5, function() {

      test
        .bool(listener.calledOnce)
          .isTrue()

        .object(listener.firstCall.args[0])
          .is({
            data: { message: 'ping 1' }
          })
      ;

      done();
    });
  });

  it('get all listeners of a given event', function(done){

    var a = function(){};
    var b = function(){};
    var c = function(){};

    ipc.on('pong', a);
    ipc.once('pong', b);
    ipc.on('pong', c);

    test
      .given(function() {
        test
          .array(ipc.listeners('pong'))
            .hasLength(3)

          .function(ipc.listeners('pong')[0])
            .isIdenticalTo(a)
            .isNotIdenticalTo(b)
            .isNotIdenticalTo(c)

          .function(ipc.listeners('pong')[1])
            .isIdenticalTo(b)

          .function(ipc.listeners('pong')[2])
            .isIdenticalTo(c)
        ;
      })

      .when(function(){
        ipc.send('ping', {});
        ipc.send('ping', {});
      })

      .then().wait(5, function() {
        test
          .array(ipc.listeners('pong'))
            .hasLength(2)

          .function(ipc.listeners('pong')[0])
            .isIdenticalTo(a)
            .isNotIdenticalTo(c)

          .function(ipc.listeners('pong')[2])
            .isIdenticalTo(c)
        ;

        done();
      })
    ;
  });

  it('remove a listener', function(done){

    var a = function(){};
    var b = function(){};
    var c = function(){};

    ipc.on('pong', a);
    ipc.once('pong', b);
    ipc.on('pong', c);

    ipc.on('foo', a);
    ipc.once('foo', b);
    ipc.on('foo', c);

    test
      .given(function(){
        test
          .array(ipc.listeners('pong'))
            .hasLength(3)

          .array(ipc.listeners('foo'))
            .hasLength(3)
        ;
      })

      .case('remove one listener of "foo"', function(){

        test
          .object(ipc.removeListener('foo', a))
            .isInstanceOf(IpcEvents)
            .isIdenticalTo(ipc)

          .array(ipc.listeners('pong'))
            .hasLength(3)
            .hasValues([a, b, c])

          .array(ipc.listeners('foo'))
            .hasLength(2)
            .hasValues([b, c])
        ;
      })

      .case('remove one listener of "pong"', function(){

        test
          .object(ipc.removeListener('pong', c))
            .isInstanceOf(IpcEvents)
            .isIdenticalTo(ipc)

          .array(ipc.listeners('pong'))
            .hasLength(2)
            .hasValues([a, b])

          .array(ipc.listeners('foo'))
            .hasLength(2)
            .hasValues([b, c])
        ;
      })

      .when(function() {
        ipc.send('ping', {});
      })

      .then().wait(20, function() {
        test
          .array(ipc.listeners('pong'))
            .hasLength(1)

          .function(ipc.listeners('pong')[0])
            .isIdenticalTo(a)

          .array(ipc.listeners('foo'))
            .hasValues([b, c])
        ;

        done();
      })
    ;
  });
});


/*----------------------------------------------------------------------------*\
  Util
\*----------------------------------------------------------------------------*/

/**
 * Check child process error
 */
function checkChild(done) {

  // delay to allow time to child.js was killed or it handles the error
  setTimeout(function() {
    if(childError) {
      throw childError;
    }else{
      done();
    }
  }, testTimeout);
}
