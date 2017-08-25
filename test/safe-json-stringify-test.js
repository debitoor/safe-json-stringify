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
	a.b = 'c';

	t.doesNotThrow(
		function() { safeJsonStringify(a); },
		'should not exceed stack size'
	);

	t.equal(
		'{"a":"[Circular]","b":"c"}',
		safeJsonStringify(a),
		'should return [Circular] for circular references'
	);
});

test('null', function(t) {
	t.plan(1);

	t.equal(
		'{"x":null}',
		safeJsonStringify({x: null}),
		'should preserve null elements'
	)
});

test('arrays', function(t) {
	t.plan(3);

	var arr = [ 2 ];
	t.equal(
		'[2]',
		safeJsonStringify(arr),
		'should add array elements'
	);

	arr.push(arr);

	t.equal(
		'[2,"[Circular]"]',
		safeJsonStringify(arr),
		'should add array elements'
	);

	t.equal(
		'{"x":[2,"[Circular]"]}',
		safeJsonStringify({x: arr}),
		'should add array elements'
	);
});

test('throwing toJSON', function(t) {
	t.plan(2);

	var obj = {
		toJSON: function() {
			throw new Error('Failing');
		}
	};

	t.equal(
		'"[Throws: Failing]"',
		safeJsonStringify(obj),
		'should not throw, just serialize to string'
	);

	t.equal(
		'{"x":"[Throws: Failing]"}',
		safeJsonStringify({ x: obj }),
		'should not throw, just serialize to string'
	);
});

test('properties on Object.create(null)', function(t) {
	t.plan(2);

	var obj = Object.create(null, {
		foo: {
			get: function() { return 'bar'; },
			enumerable: true
		}
	});
	t.equal(
		'{"foo":"bar"}',
		safeJsonStringify(obj),
		'should return value of non-throwing getter'
	);

	var obj = Object.create(null, {
		foo: {
			get: function() { return 'bar'; },
			enumerable: true
		},
		broken: {
			get: function() { throw new Error('Broken'); },
			enumerable: true
		}
	});
	t.equal(
		'{"foo":"bar","broken":"[Throws: Broken]"}',
		safeJsonStringify(obj),
		'should return value of non-throwing getter'
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
		'{"foo":"[Throws: Cannot read property \'oh my\' of undefined]"}',
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
		'{"foo":"[Throws: Cannot read property \'oh my\' of undefined]"}',
		safeJsonStringify(obj),
		'should return [Throws] when a getter throws an error'
	);
});

test('formatting', function(t) {
	var obj = {a:{b:1, c:[{d: 1}]}}; // some nested object
	var formatters = [3, "\t", "	"];
	t.plan(formatters.length)
	formatters.forEach((formatter) => {
		t.equal(
			JSON.stringify(obj, null, formatter),
			safeJsonStringify(obj, null, formatter),
			'should apply identical formatting as JSON.stringify itself'
		);
		// t.notEqual(
		// 	safeJsonStringify(obj, null),
		// 	safeJsonStringify(obj, null, formatter),
		// 	'should not test trivial identities'
		// );
	});
});

test('replacing', function(t) {
	var obj = {a:{b:1, c:[{d: 1}]}}; // some nested object
	var replacers = [
		["a", "c"],
		(k, v) => typeof v == 'number' ? "***" : v,
		() => undefined,
		[]
	];
	t.plan(replacers.length)
	replacers.forEach((replacer) => {
		t.equal(
			JSON.stringify(obj, replacer),
			safeJsonStringify(obj, replacer),
			'should use replacer functionality the identical way as JSON.stringify itself'
		);
		// t.notEqual(
		//	 safeJsonStringify(obj, null),
		//	 safeJsonStringify(obj, replacer),
		//	 'should not test trivial identities'
		// );
	});
});
