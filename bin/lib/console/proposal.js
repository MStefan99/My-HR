'use strict';

const openDB = require('../db');

const libApplication = require('../application');


class Proposal {
	static proposalsNeeded = process.env.PROPOSALS_NEEDED || 3;
	id;
	userID;
	applicationID;


	static async createProposal(user,
	                            application,
	                            status,
	                            proposalsNeeded = Proposal.proposalsNeeded) {
		if (status !== -1 && status !== 1) {
			return 'INVALID_STATUS'
		}

		if (await Proposal.getProposal(user, application) !== 'NO_PROPOSAL') {
			return 'ALREADY_EXISTS'
		}

		switch (application.accepted) {
			case 1:
				return 'ALREADY_ACCEPTED';
			case -1:
				return 'ALREADY_REJECTED';
			default:
				const proposal = new Proposal();

				proposal.userID = user.id;
				proposal.applicationID = application.id;

				const db = await openDB();
				await db.run(`insert into console_proposals(user_id, application_id, status)
                              values ($uid, $aid, $status)`,
					{
						$uid: proposal.userID,
						$aid: proposal.applicationID,
						$status: status
					});
				proposal.id = (await db.get(`select last_insert_rowid() as id`)).id;

				const proposals = await db.all(`select status, count(id) as count
                                                from console_proposals
                                                where application_id=$aid
                                                group by status`,
					{$aid: application.id});
				await db.close();

				const approved = proposals.find(row => row.count >= proposalsNeeded);
				if (approved) {
					switch (approved.status) {
						case 1:
							await application.accept();
							return 'ACCEPTED';
						case -1:
							await application.reject();
							return 'REJECTED';
					}
				}
				return proposal;
		}
	}


	static async getProposal(user, application) {
		const db = await openDB();
		const proposalData = await db.get(`select id,
                                                  user_id        as userID,
                                                  application_id as applicationID,
                                                  status
                                           from console_proposals
                                           where user_id=$uid
                                             and application_id=$aid`,
			{$uid: user.id, $aid: application.id});
		await db.close();

		if (proposalData) {
			const proposal = new Proposal();

			Object.assign(proposal, proposalData);
			return proposal;
		} else {
			return 'NO_PROPOSAL';
		}
	}


	static async getApplicationProposalCount(application) {
		const db = await openDB();

		const proposals = {};
		await db.each(`select status, count(id) as count
                                         from console_proposals
                                         where application_id=$aid
                                         group by status`,
			{$aid: application.id}, (err, row) => {
				switch (row.status) {
					case 1:
						proposals.accepted = row.count;
						break;
					case -1:
						proposals.rejected = row.count;
						break;
				}
			});
		await db.close();

		return proposals;
	}


	async delete() {
		const application = await libApplication
			.getApplicationByID(this.applicationID);

		switch (application.accepted) {
			case 1:
				return 'ALREADY_ACCEPTED';
			case -1:
				return 'ALREADY_REJECTED';
			default:
				const db = await openDB();
				await db.run(`delete
                              from console_proposals
                              where user_id=$uid
                                and application_id=$aid`,
					{$uid: this.userID, $aid: this.applicationID});
				await db.close();
				return 'OK';
		}
	}
}


module.exports = Proposal;
