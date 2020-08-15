'use strict';

const buckets = [];
const defaults = {
	price: 1,  // How many tokens is spent per request
	rate: 10,  // How many new tokens per minute
	initial: 10,  // How many tokens each bucket has when created, can exceed max
	max: 30,  // Maximum amount of tokens
	min: -10,  // Minimum amount of tokens
	scheme: 'ip',  // Field of the request to be used as an id, supports nesting
	tag: null,  // A tag to separate different actions
	redirect: false,  // Indicates whether to end the request or redirect back
	action: null  // A callback to be run when rate exceeded
	// Has the following signature: (req, res) => {};
}


function clamp(val, min, max) {
	return val < min ? min : val > max ? max : val;
}


function getProperty(object, propertyName) {
	propertyName = propertyName
		.replace(/\[['"](.*?)['"]]/g, '.$1')
		.replace(/^\./, '');

	const properties = propertyName.split('.');
	for (const property of properties) {
		object = object[property] || null;
	}
	return object;
}


module.exports = (options) => {
	options = Object.assign({}, defaults, options);

	return (req, res, next) => {
		if (typeof getProperty(req,
			options.scheme) === 'object') {
			throw new Error('Scheme must be a primitive');
		}
		if (typeof options.tag === 'object' && options.tag) {
			throw new Error('Tag must be a primitive');
		}

		const id = options.scheme + '-' +
			getProperty(req, options.scheme);
		let bucket = buckets.find(bucket =>
			bucket.id === id && bucket.tag === options.tag);

		if (!bucket) {
			bucket = {
				id: id,
				tag: options.tag,
				tokens: options.initial,
				modified: Date.now(),
			}
			buckets.push(bucket);
		}

		bucket.tokens += Math.floor((Date.now() - bucket.modified)
			/ 1000 / 60 * options.rate);
		bucket.modified = Date.now();
		const tokens = bucket.tokens;
		bucket.tokens = clamp(bucket.tokens - options.price,
			options.min, options.max);

		if (tokens >= options.price) {
			next();
		} else {
			res.set('Retry-After', Math.ceil((options.price - bucket.tokens / options.rate) * 60))
			if (options.action) {
				options.action(req, res);
			}
			if (options.redirect) {
				res.redirect(303, 'back');
			} else {
				res.sendStatus(429);
			}
		}
	}
}
