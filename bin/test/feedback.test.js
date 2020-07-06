'use strict';

const libFeedback = require('../lib/feedback');

const testLibFeedback = require('./testLib/feedback');


describe('With test feedback', () => {
	let feedback;

	const name = 'Test name';
	const email = 'test@example.com';
	const message = 'Feedback message';
	const feedbackData = {name: name, email: email, message: message};


	beforeAll(async () => {
		feedback = await libFeedback.createFeedback(name, email, message);
	});


	afterAll(async () => {
		await testLibFeedback.deleteFeedbackById(feedback.id);
	});


	test('Check created object', async () => {
		expect(feedback).toMatchObject(feedbackData);

		expect(feedback.id).toBeDefined();
	});


	test('Get feedback by id', async () => {
		expect(await libFeedback.getFeedbackByID(feedback.id))
			.toMatchObject(feedback);
	});


	test('Get invalid feedback', async () => {
		expect(await libFeedback.getFeedbackByID(-1))
			.toBe('NO_FEEDBACK');
	});


	test('Get all feedback', async () => {
		expect(await libFeedback.getAllFeedback())
			.toContainEqual(feedback);
	});
});
