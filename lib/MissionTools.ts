import STTApi from "./index";

function loadQuestData(completed: boolean, quest: any): Promise<void> {
	if (completed)
	{
		return STTApi.quests.where('id').equals(quest.id).first((entry: any) => {
			if (entry) {
				//console.info('Found ' + quest.id + ' in the quest cache');
				quest.description = entry.description;
				quest.challenges = entry.challenges;
				quest.mastery_levels = entry.mastery_levels;

				// For cadet challenges
				quest.cadet = entry.cadet;
				quest.crew_requirement = entry.crew_requirement;

				return Promise.resolve();
			} else {
				return loadConflictInfo(quest);
			}
		});
	}
	else {
		return loadConflictInfo(quest);
	}
}

function loadConflictInfo(quest: any): Promise<void> {
	return STTApi.executeGetRequest("quest/conflict_info", { id: quest.id }).then((data: any) => {
		if (data.mastery_levels) {
			quest.description = data.description;
			quest.challenges = data.challenges;
			quest.mastery_levels = data.mastery_levels;

			// For cadet challenges
			quest.cadet = data.cadet;
			quest.crew_requirement = data.crew_requirement;

			return STTApi.quests.put({
				id: quest.id,
				description: quest.description,
				challenges: quest.challenges,
				mastery_levels: quest.mastery_levels,
				cadet: quest.cadet,
				crew_requirement: quest.crew_requirement
			}).then(() => {
				return Promise.resolve();
			});
		} else {
			return Promise.reject("Invalid data for quest conflict!");
		}
	});
}

export interface IMissionData {
	id: number;
	episode_title: string;
	description: string;
	stars_earned: number;
	total_stars: number;
	quests: any[];
}

export function loadMissionData(accepted_missions: any, dispute_histories: any): Promise<IMissionData[]> {
	var mission_ids: any[] = [];
	
	accepted_missions.forEach((mission: any) => {
		if (mission.symbol !== 'mission_npev2') {
			// Ignore the tutorial episode
			mission_ids.push(mission.id);
		}
	});

	// Add all the episodes' missions (if not cadet)
	if (dispute_histories) {
		dispute_histories.forEach((dispute: any) => {
			if (dispute.symbol === 'dispute_logic_under_fire_NPE') {
				return; // Ignore the tutorial dispute
			}

			mission_ids = mission_ids.concat(dispute.mission_ids);
		});
	}

	return STTApi.executeGetRequest("mission/info", { ids: mission_ids }).then((data: any) => {
		let missions: IMissionData[] = [];
		let questPromises: Promise<void>[] = [];

		data.character.accepted_missions.forEach((mission: any) => {
			if (mission.symbol === 'mission_npev2')  {
				return; // Ignore the tutorial episode
			}

			if (mission.episode_title != null) {
				let missionData: IMissionData = {
					id: mission.id,
					episode_title: mission.episode_title,
					description: mission.description,
					stars_earned: mission.stars_earned,
					total_stars: mission.total_stars,
					quests: []
				};

				mission.quests.forEach((quest: any) => {
					if ((!quest.locked) && quest.name) {
						if (quest.quest_type == 'ConflictQuest') {
							questPromises.push(loadQuestData(mission.stars_earned == mission.total_stars, quest));
						}
						else {
							quest.description = 'Ship battle';
						}

						missionData.quests.push(quest);
					}
				});

				missions.push(missionData);
			}
			else {
				// Could be one of the episodes
				if (dispute_histories) {
					dispute_histories.forEach((dispute: any) => {
						if (dispute.symbol === 'dispute_logic_under_fire_NPE') {
							return; // Ignore the tutorial dispute
						}

						if (dispute.mission_ids.includes(mission.id)) {
							if (!dispute.quests)
								dispute.quests = [];

							mission.quests.forEach((quest: any) => {
								if ((!quest.locked) && quest.name && !dispute.quests.find((q: any) => q.id == quest.id)) {
									if (quest.quest_type == 'ConflictQuest') {
										questPromises.push(loadQuestData(dispute.stars_earned == dispute.total_stars, quest));
									}
									else {
										quest.description = 'Ship battle';
									}

									dispute.quests.push(quest);
								}
							});
						}
					});
				}
			}
		});

		return Promise.all(questPromises).then(() => {
			if (dispute_histories) {
				// Pretend the episodes (disputes) are missions too, to get them to show up
				dispute_histories.forEach((dispute: any) => {
					if (dispute.symbol === 'dispute_logic_under_fire_NPE') {
						return; // Ignore the tutorial dispute
					}

					let missionData: IMissionData = {
						id: dispute.mission_ids[0],
						episode_title: 'Episode ' + dispute.episode + ' : ' + dispute.name,
						description: 'Episode ' + dispute.episode,
						stars_earned: dispute.stars_earned,
						total_stars: dispute.total_stars,
						quests: dispute.quests
					};

					missions.push(missionData);
				});
			}

			return Promise.resolve(missions);
		});
	});
}