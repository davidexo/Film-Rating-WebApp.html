/*
 * Heavily borrowed from Baretest. (https://volument.com/baretest)
 */

/*
(The MIT License)

Copyright (c) 2020 OpenJS Foundation and contributors, https://openjsf.org

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import rgb from './barecolor.js';
import { strict as assert } from 'assert';

const tests = [],
	before = [],
	after = [];

export default function test(name, fn) {
	tests.push({ name: name, fn: fn });
}

test.before = function(fn) {
	before.push(fn);
};
test.after = function(fn) {
	after.push(fn);
};

// Run the tests
test.run = async function() {
	let pass = 0;
	let fail = 0;
	let count = 0;

	rgb.whiteln(`TAP version 13`);

	for (const test of tests) {
		count += 1;
		try {
			for (const fn of before) await fn();
			await test.fn(assert); // Inject assertions
			rgb.greenln(`ok – ${count} ${test.name}`);
			pass += 1;
		} catch (e) {
			rgb.redln(`not ok – ${count} ${test.name}`);
			prettyError(e);
			fail += 1;
		}
	}
	for (const fn of after) await fn();

	rgb.whiteln(`\n1..${count}\n# tests ${count}\n# pass ${pass}`);
	if (fail > 0) {
		rgb.redln(`# fail ${fail}`);
	} else {
		rgb.greenln(`\n# ok\n`);
	}
	process.exit(); // Don’t run tests twice.
};

function prettyError(e) {
	const msg = e.stack;
	if (!msg) return rgb.yellow(e);
	const i = msg.indexOf('\n');
	const at = msg.indexOf('at');
	rgb.grayln('# ' + msg.slice(0, i));
	const description = msg.slice(i, at).split('\n');
	description.forEach((it) => {
		rgb.grayln('# ' + it);
	});
}

// Run tests automagically.
process.on('beforeExit', (code) => {
	test.run();
});
