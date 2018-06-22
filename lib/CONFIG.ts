export interface Rarity {
	name: string;
	color: string;
}

function rgbToHex(r: number, g: number, b: number): string {
	return "#" + ((b | g << 8 | r << 16) / 0x1000000).toString(16).substring(2);
}

export default class CONFIG {
	static readonly URL_PLATFORM: string = "https://thorium.disruptorbeam.com/";
	static readonly URL_SERVER: string = "https://stt.disruptorbeam.com/";

	// default client_id of the Steam Windows version of STT
	static readonly CLIENT_ID: string = "4fc852d7-d602-476a-a292-d243022a475d";
	static readonly CLIENT_API_VERSION: number = 11;
	static readonly CLIENT_VERSION: string = "5.1.0";
	static readonly CLIENT_PLATFORM: string = "webgl";

	// releases URL
	static readonly URL_GITHUBRELEASES: string = "https://api.github.com/repos/IAmPicard/StarTrekTimelinesSpreadsheet/releases";

	// Every 10 days, check the wiki again for updated / new images
	static readonly HOURS_TO_RECOVERY: number = 24 * 10;

	static readonly RARITIES: Rarity[] = [
		{ name: 'Basic', color: 'Grey' },
		{ name: 'Common', color: rgbToHex(155, 155, 155) },
		{ name: 'Uncommon', color: rgbToHex(80, 170, 60) },
		{ name: 'Rare', color: rgbToHex(90, 170, 255) },
		{ name: 'Super Rare', color: rgbToHex(170, 45, 235) },
		{ name: 'Legendary', color: rgbToHex(253, 210, 106) }
	];

	static readonly SKILLS: { [index: string]: string } = {
		'command_skill': 'Command',
		'science_skill': 'Science',
		'security_skill': 'Security',
		'engineering_skill': 'Engineering',
		'diplomacy_skill': 'Diplomacy',
		'medicine_skill': 'Medicine'
	};

	static readonly CREW_SHIP_BATTLE_BONUS_TYPE: { [index: number]: string } = {
		0: 'Attack',
		1: 'Evasion',
		2: 'Accuracy',
		// These are only for penalty
		3: 'Shield Regeneration'
	};

	static readonly CREW_SHIP_BATTLE_TRIGGER: { [index: number]: string } = {
		0: 'None',
		1: 'Position',
		2: 'Cloak',
		4: 'Boarding'
	};

	static readonly CREW_SHIP_BATTLE_ABILITY_TYPE: { [index: number]: string } = {
		0: 'Increase bonus boost by +%VAL%',
		1: 'Immediately deals %VAL%% damage',
		2: 'Immediately repairs Hulls by %VAL%%',
		3: 'Immediately repairs Shields by %VAL%%',
		4: '+%VAL% to Crit Rating',
		5: '+%VAL% to Crit Bonus',
		6: 'Shield regeneration +%VAL%',
		7: '+%VAL%% to Attack Speed',
		8: 'Increase boarding damage by %VAL%%'
	};

	static SPRITES: { [index: string]: { asset: string, url: string|undefined } } = {
		'mastery_highest_icon': { asset: 'atlas_stt_icons', url: undefined },
		'mastery_medium_icon': { asset: 'atlas_stt_icons', url: undefined },
		'mastery_lowest_icon': { asset: 'atlas_stt_icons', url: undefined },
		'star_reward': { asset: 'atlas_stt_icons', url: undefined },
		'star_reward_inactive': { asset: 'atlas_stt_icons', url: undefined },
		'fleet_rank_admiral_icon': { asset: 'atlas_stt_icons', url: undefined },
		'fleet_rank_captain_icon': { asset: 'atlas_stt_icons', url: undefined },
		'fleet_rank_ensign_icon': { asset: 'atlas_stt_icons', url: undefined },
		'fleet_rank_lt_icon': { asset: 'atlas_stt_icons', url: undefined },
		'honor_currency': { asset: 'atlas_stt_icons', url: undefined },
		'icon_command_skill': { asset: 'atlas_stt_icons', url: undefined },
		'icon_diplomacy_skill': { asset: 'atlas_stt_icons', url: undefined },
		'icon_engineering_skill': { asset: 'atlas_stt_icons', url: undefined },
		'icon_medicine_skill': { asset: 'atlas_stt_icons', url: undefined },
		'icon_science_skill': { asset: 'atlas_stt_icons', url: undefined },
		'icon_security_skill': { asset: 'atlas_stt_icons', url: undefined },
		'icon_shuttle_lg': { asset: 'atlas_stt_icons', url: undefined },
		'node_icon': { asset: 'atlas_stt_icons', url: undefined },
		'pe_currency_icon': { asset: 'atlas_stt_icons', url: undefined },
		'pp_currency_icon': { asset: 'atlas_stt_icons', url: undefined },
		'soft_currency_icon': { asset: 'atlas_stt_icons', url: undefined },
		'victory_point_icon': { asset: 'atlas_stt_icons', url: undefined },
		'energy_icon': { asset: 'atlas_stt_icons', url: undefined }, // chronitons
		'cadet_icon': { asset: 'atlas_stt_icons', url: undefined }, // cadet
		'images_currency_honor_currency_0': { asset: '', url: undefined }, // honor
		'images_currency_pe_currency_0': { asset: '', url: undefined }, // merits
		'images_currency_pp_currency_0': { asset: '', url: undefined }, // dilithium
		'images_currency_sc_currency_0': { asset: '', url: undefined } // credits
	};
}