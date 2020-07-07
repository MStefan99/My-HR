'use strict';

const openDB = require('../db');


class Note {
	id;
	userID;
	applicationID;
	shared;
	message;


	static async createNote(user, application, shared, message) {
		const note = new Note();

		note.userID = user.id;
		note.applicationID = application ? application.id : null;
		note.shared = shared;
		note.message = message;
		note.time = Date.now();

		if (!message) {
			return 'NO_MESSAGE'
		} else {
			const db = await openDB();
			await db.run(`insert into console_notes(user_id,
                                                    application_id,
                                                    shared,
                                                    message,
                                                    time)
                          values ($uid, $aid, $shared, $message, $time)`, {
				$uid: note.userID,
				$aid: note.applicationID,
				$shared: note.shared ? 1 : 0,
				$message: note.message,
				$time: note.time
			});
			note.id = (await db.get(`select last_insert_rowid() as id`)).id;
			await db.close();

			return note;
		}
	}


	static async getNoteByID(noteID) {
		const note = new Note();

		const db = await openDB();
		const noteData = await db.get(`select id,
                                              user_id        as userID,
                                              application_id as applicationID,
                                              shared,
                                              message,
                                              time
                                       from console_notes
                                       where id=$id`, {$id: noteID});
		await db.close();

		if (!noteData) {
			return 'NO_NOTE'
		} else {
			Object.assign(note, noteData);
			note.shared = !!noteData.shared;
			return note;
		}
	}


	static async getCommonNotes(user) {
		const notes = [];

		const db = await openDB();
		const allNoteData = await db.all(`select id,
                                                 user_id        as userID,
                                                 application_id as applicationID,
                                                 shared,
                                                 message,
                                                 time
                                          from console_notes
                                          where application_id is null
                                            and (shared=1 or user_id=$uid)`,
			{$uid: user.id});
		await db.close();

		for (const noteData of allNoteData) {
			const note = new Note();

			Object.assign(note, noteData);
			note.shared = !!noteData.shared;
			notes.push(note)
		}
		return notes;
	}


	static async getApplicationNotes(user, application) {
		const notes = [];

		const db = await openDB();
		const allNoteData = await db.all(`select id,
                                                 user_id        as userID,
                                                 application_id as applicationID,
                                                 shared,
                                                 message,
                                                 time
                                          from console_notes
                                          where application_id=$aid
                                            and (shared=1 or user_id=$uid)`,
			{$uid: user.id, $aid: application.id});
		await db.close();

		for (const noteData of allNoteData) {
			const note = new Note();

			Object.assign(note, noteData);
			note.shared = !!noteData.shared;
			notes.push(note)
		}
		return notes;
	}


	async updateMessage(newMessage) {
		if (!newMessage) {
			return 'NO_MESSAGE';
		} else {
			this.message = newMessage;

			const db = await openDB();
			await db.run(`update console_notes
                          set message=$msg
                          where id=$id`, {$msg: newMessage, $id: this.id});
			await db.close();

			return 'OK';
		}
	}


	async delete() {
		const db = await openDB();
		await db.run(`delete
                      from console_notes
                      where id=$id`, {$id: this.id});
		await db.close();

		return 'OK';
	}
}


module.exports = Note;
