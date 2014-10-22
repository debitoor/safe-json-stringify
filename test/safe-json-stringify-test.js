var test = require('tape');
var safeJsonStringify = require('../index');

test('basic stringify', function(t) {
	t.plan(2);

	t.equal('"foo"', safeJsonStringify('foo'), 'a simple string');
	t.equal('{"foo":"bar"}', safeJsonStringify({foo: 'bar'}), 'a simple object');
});

test('circular references', function(t) {
	t.plan(2);

	var a = {};
	a.a = a;

	t.doesNotThrow(
		function() { safeJsonStringify(a); },
		'should not exceed stack size'
	);

	t.equal(
		'{"a":{"a":"[Circular]"}}',
		safeJsonStringify(a),
		'should return [Circular] for circular references'
	);
});

test('defined getter properties using __defineGetter__', function(t) {
	t.plan(3);

	// non throwing
	var obj = {};
	obj.__defineGetter__('foo', function() { return 'bar'; });
	t.equal(
		'{"foo":"bar"}',
		safeJsonStringify(obj),
		'should return value of non-throwing getter'
	);

	// throwing
	obj = {};
	obj.__defineGetter__('foo', function() { return undefined['oh my']; });

	t.doesNotThrow(
		function(){ safeJsonStringify(obj)},
		'should return throw if a getter throws an error'
	);

	t.equal(
		'{"foo":"[Throws]"}',
		safeJsonStringify(obj),
		'should return [Throws] when a getter throws an error'
	);
});

test('enumerable defined getter properties using Object.defineProperty', function(t) {
	t.plan(3);

	// non throwing
	var obj = {};
	Object.defineProperty(obj, 'foo', {get: function() { return 'bar'; }, enumerable: true});
	t.equal(
		'{"foo":"bar"}',
		safeJsonStringify(obj),
		'should return value of non-throwing getter'
	);

	// throwing
	obj = {};
	Object.defineProperty(obj, 'foo', {get: function() { return undefined['oh my']; }, enumerable: true});

	t.doesNotThrow(
		function(){ safeJsonStringify(obj)},
		'should return throw if a getter throws an error'
	);

	t.equal(
		'{"foo":"[Throws]"}',
		safeJsonStringify(obj),
		'should return [Throws] when a getter throws an error'
	);
});
