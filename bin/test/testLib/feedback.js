'use strict';

const openDB = require('../../lib/db');


async function deleteFeedbackById(feedbackID) {
	const db = await openDB();
	await db.run(`delete
                  from feedback
                  where id=$id`, {$id: feedbackID});
}


module.exports = {
	deleteFeedbackById: deleteFeedbackById
}
