'use strict';

const openDB = require('./db');


class Feedback {
	id;
	name;
	email;
	message;


	static async createFeedback(name, email, message) {
		const feedback = new Feedback();

		feedback.name = name;
		feedback.email = email;
		feedback.message = message;

		const db = await openDB();
		await db.run(`insert into feedback(name, email, message)
                      values ($name, $email, $message)`, {
			$name: feedback.name,
			$email: feedback.email,
			$message: feedback.message
		});
		feedback.id = (await db.get(`select last_insert_rowid() as id`)).id;
		await db.close();
		
		return feedback;
	}
	
	
	static async getAllFeedback() {
		const feedbacks = [];
		
		const db = await openDB();
		const allFeedbackData = await db.all(`select * from feedback`);
		await db.close();
		
		for (const feedbackData of allFeedbackData) {
			const feedback = new Feedback();
			
			Object.assign(feedback, feedbackData);
			feedbacks.push(feedback);
		}
		return feedbacks;
	}


	static async getFeedbackByID(feedbackID) {
		const feedback = new Feedback();

		const db = await openDB();
		const feedbackData = await db.get(`select *
                                       from feedback
                                       where id=$id`, {$id: feedbackID});
		await db.close();

		if (!feedbackData) {
			return 'NO_FEEDBACK'
		} else {
			Object.assign(feedback, feedbackData);
			return feedback;
		}
	}
}


module.exports = Feedback;
