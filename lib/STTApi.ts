/*
    StarTrekTimelinesSpreadsheet - A tool to help with crew management in Star Trek Timelines
    Copyright (C) 2017 IAmPicard

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
import { NetworkInterface } from "./NetworkInterface";
import { NetworkFetch } from "./NetworkFetch";
import { DexieCache, QuestsTable, ImmortalsTable, ConfigTable, WikiImageTable } from "./Cache";
import { IChallengeSuccess, MinimalComplement } from './MissionCrewSuccess';
import { mergeDeep } from './ObjectMerge';
import { ImageProvider, ImageCache, IFoundResult } from './ImageProvider';
import { WikiImageProvider } from './WikiImageTools';
import { AssetImageProvider } from './AssetImageProvider';
import Dexie from "dexie";
import CONFIG from "./CONFIG";

export class STTApiClass {
	private _accessToken: string | undefined;
	private _net: NetworkInterface;
	private _crewAvatars: any;
	private _serverConfig: any;
	private _playerData: any;
	private _platformConfig: any;
	private _shipSchematics: any;
	private _starbaseData: any;
	private _fleetData: any;
	private _fleetMemberInfo: any;
	private _roster: any;
	private _ships: any;
	private _missions: any;
	private _missionSuccess: IChallengeSuccess[];
	private _minimalComplement?: MinimalComplement;
	private _cache: DexieCache;
	private _imageProvider : ImageProvider;

	constructor() {
		this.refreshEverything(true);

		this._net = new NetworkFetch();

		// TODO: Dexie uses IndexedDB, so doesn't work in plain node.js without polyfill - should the caching be an interface?
		this._cache = new DexieCache("sttcache");
	}

	refreshEverything(logout: boolean) {
		this._crewAvatars = null;
		this._serverConfig = null;
		this._playerData = null;
		this._platformConfig = null;
		this._shipSchematics = null;
		this._starbaseData = null;
		this._fleetData = null;
		this._fleetMemberInfo = null;
		this._roster = null;
		this._ships = null;
		this._missions = null;
		this._missionSuccess = [];
		this._minimalComplement = undefined;

		if (logout) {
			this._accessToken = undefined;
		}
	}

	setImageProvider(useAssets: boolean, imageCache: ImageCache|undefined) {
		if (useAssets) {
			this._imageProvider = new AssetImageProvider(imageCache);
		}
		else {
			this._imageProvider = new WikiImageProvider();
		}
	}

	get roster(): any {
		return this._roster;
	}

	get ships(): any {
		return this._ships;
	}

	get missions(): any {
		return this._missions;
	}

	get missionSuccess(): any {
		return this._missionSuccess;
	}

	get minimalComplement(): MinimalComplement|undefined {
		return this._minimalComplement;
	}

	// TODO: these setters should only be accessible form LoginSequence - perhaps make that a member of STTApi and pass in constructor
	set roster(value: any) {
		this._roster = value;
	}
	set ships(value: any) {
		this._ships = value;
	}
	set missions(value: any) {
		this._missions = value;
	}
	set missionSuccess(value: any) {
		this._missionSuccess = value;
	}
	set minimalComplement(value: MinimalComplement|undefined) {
		this._minimalComplement = value;
	}

	get networkHelper(): NetworkInterface {
		return this._net;
	}

	get imageProvider(): ImageProvider {
		return this._imageProvider;
	}

	get quests(): Dexie.Table<QuestsTable, number> {
		return this._cache.quests;
    }
    
    get immortals(): Dexie.Table<ImmortalsTable, string> {
		return this._cache.immortals;
    }
    
    get wikiImages(): Dexie.Table<WikiImageTable, string> {
		return this._cache.wikiImages;
	}

	get config(): Dexie.Table<ConfigTable, string> {
		return this._cache.config;
	}

	get accessToken(): string | undefined {
		return this._accessToken;
	}

	get loggedIn(): boolean {
		return this._accessToken != null;
	}

	get playerData(): any {
		return this._playerData.player;
	}

	get crewAvatars(): any {
		return this._crewAvatars;
	}

	get itemArchetypeCache(): any {
		return this._playerData.item_archetype_cache;
	}

	get shipSchematics(): any {
		return this._shipSchematics;
	}

	get fleetData(): any {
		return this._fleetData;
	}

	get fleetMembers(): any {
		return this._fleetMemberInfo.members;
	}

	get fleetSquads(): any {
		return this._fleetMemberInfo.squads;
	}

	get starbaseRooms(): any {
		return this._starbaseData[0].character.starbase_rooms;
	}

	get serverConfig(): any {
		return this._serverConfig;
	}

	getTraitName(trait: string): string {
		return this._platformConfig.config.trait_names[trait] ? this._platformConfig.config.trait_names[trait] : trait;
	}

	getShipTraitName(trait: string): string {
		return this._platformConfig.config.ship_trait_names[trait] ? this._platformConfig.config.ship_trait_names[trait] : trait;
	}

	getCrewAvatarById(id: number): any {
		return this._crewAvatars.find((avatar: any) => avatar.id === id);
	}

	getCrewAvatarBySymbol(symbol: string): any {
		return this._crewAvatars.find((avatar: any) => avatar.symbol === symbol);
	}

	login(username: string, password: string, autoLogin: boolean): Promise<any> {
		return this._net.post(CONFIG.URL_PLATFORM + "oauth2/token", {
			"username": username,
			"password": password,
			"client_id": CONFIG.CLIENT_ID,
			"grant_type": "password"
		}).then((data: any) => {
			if (data.error_description) {
				return Promise.reject(data.error_description);
			} else if (data.access_token) {
				return this._loginWithAccessToken(data.access_token, autoLogin);
			} else {
				return Promise.reject("Invalid data for login!");
			}
		});
	}

	loginWithCachedAccessToken(): Promise<boolean> {
		return this._cache.config.where('key').equals('autoLogin').first((entry: ConfigTable | undefined) => {
			if (entry && entry.value === true) {
				return this._cache.config.where('key').equals('accessToken').first((entry: ConfigTable | undefined) => {
					if (entry && entry.value) {
						this._accessToken = entry.value;
						return Promise.resolve(true);
					}
					else {
						return Promise.resolve(false);
					}
				});
			}
			else {
				return Promise.resolve(false);
			}
		});
	}

	private _loginWithAccessToken(access_token: string, autoLogin: boolean): Promise<void> {
		this._accessToken = access_token;
		console.info("Logged in with access token " + access_token);

		if (autoLogin) {
			return this._cache.config.put({
				key: 'autoLogin',
				value: autoLogin
			}).then(() => {
				return this._cache.config.put({
					key: 'accessToken',
					value: access_token
				}).then(() => {
					return Promise.resolve();
				});
			});
		}
		else {
			return Promise.resolve();
		}
	}

	loginWithFacebook(facebookAccessToken: string, facebookUserId: string, autoLogin: boolean): Promise<any> {
		return this._net.post(CONFIG.URL_PLATFORM + "oauth2/token", {
			"third_party.third_party": "facebook",
			"third_party.access_token": facebookAccessToken,
			"third_party.uid": facebookUserId,
			"client_id": CONFIG.CLIENT_ID,
			"grant_type": "third_party"
		}).then((data: any) => {
			if (data.error_description) {
				return Promise.reject(data.error_description);
			} else if (data.access_token) {
				return this._loginWithAccessToken(data.access_token, autoLogin);
			} else {
				return Promise.reject("Invalid data for login!");
			}
		});
	}

	executeGetRequest(resourceUrl: string, qs: any = {}): Promise<any> {
		if (this._accessToken === undefined) {
			return Promise.reject("Not logged in!");
		}

		return this._net.get(CONFIG.URL_SERVER + resourceUrl,
			Object.assign({ client_api: CONFIG.CLIENT_API_VERSION, access_token: this._accessToken}, qs));
	}

	executePostRequest(resourceUrl: string, qs: any): Promise<any> {
		if (this._accessToken === undefined) {
			return Promise.reject("Not logged in!");
		}

		return this._net.post(CONFIG.URL_SERVER + resourceUrl,
			Object.assign({ client_api: CONFIG.CLIENT_API_VERSION }, qs),
			this._accessToken
		);
	}

	loadServerConfig(): Promise<any> {
		return this.executeGetRequest("config", {
			platform:'WebGLPlayer',
			device_type:'Desktop',
			client_version:CONFIG.CLIENT_VERSION,
			platform_folder:CONFIG.CLIENT_PLATFORM
		}).then((data: any) => {
			this._serverConfig = data;
			console.info("Loaded server config");
			return Promise.resolve();
		});
	}

	loadCrewArchetypes(): Promise<any> {
		return this.executeGetRequest("character/get_avatar_crew_archetypes").then((data: any) => {
			if (data.crew_avatars) {
				this._crewAvatars = data.crew_avatars;
				console.info("Loaded " + data.crew_avatars.length +" crew avatars");
				return Promise.resolve();
			} else {
				return Promise.reject("Invalid data for crew avatars!");
			}
		});
	}

	loadPlatformConfig(): Promise<any> {
		return this.executeGetRequest("config/platform").then((data: any) => {
			this._platformConfig = data;
			console.info("Loaded platform config");
			return Promise.resolve();
		});
	}

	loadPlayerData(): Promise<any> {
		return this.executeGetRequest("player").then((data: any) => {
			if (data.player) {
				this._playerData = data;
				console.info("Loaded player data");
				return Promise.resolve();
			} else {
				return Promise.reject("Invalid data for player!");
			}
		});
	}

	resyncPlayerCurrencyData(): Promise<any> {
		// this code reloads minimal stuff to update the player information and merge things back in
		// "player/resync_inventory" is more heavy-handed and has the potential to overwrite some stuff we added on like images, but can also bring in any new items, crew or ships
		return this.executeGetRequest("player/resync_currency").then((data: any) => {
			if (data.player) {
				this._playerData.player = mergeDeep(this._playerData.player, data.player);
				console.info("Resynced player currency data");
				return Promise.resolve();
			} else {
				return Promise.reject("Invalid data for player!");
			}
		});
	}

	loadShipSchematics(): Promise<any> {
		return this.executeGetRequest("ship_schematic").then((data: any) => {
			if (data.schematics) {
				this._shipSchematics = data.schematics;
				console.info("Loaded " + data.schematics.length + " ship schematics");

				return Promise.resolve();
			} else {
				return Promise.reject("Invalid data for ship schematics!");
			}
		});
	}

	loadFrozenCrew(symbol: string): Promise<any> {
		return this.executePostRequest("stasis_vault/immortal_restore_info", { symbol: symbol }).then((data: any) => {
			if (data.crew) {
				//console.info("Loaded frozen crew stats for " + symbol);
				return Promise.resolve(data.crew);
			} else {
				return Promise.reject("Invalid data for frozen crew!");
			}
		});
	}

	loadFleetMemberInfo(guildId: string): Promise<any> {
		return this.executePostRequest("fleet/complete_member_info", { guild_id: guildId }).then((data: any) => {
			if (data) {
				this._fleetMemberInfo = data;
				console.info("Loaded fleet member info");
				return Promise.resolve();
			} else {
				return Promise.reject("Invalid data for fleet member info!");
			}
		});
	}

	loadFleetData(guildId: string): Promise<any> {
		return this.executeGetRequest("fleet/" + guildId).then((data: any) => {
			if (data.fleet) {
				this._fleetData = data.fleet;
				console.info("Loaded fleet data");
				return Promise.resolve();
			} else {
				return Promise.reject("Invalid data for fleet!");
			}
		});
	}

	loadStarbaseData(guildId: string): Promise<any> {
		return this.executeGetRequest("starbase/get").then((data: any) => {
			if (data) {
				this._starbaseData = data;
				console.info("Loaded starbase data");
				return Promise.resolve();
			} else {
				return Promise.reject("Invalid data for starbase!");
			}
		});
	}

	inspectPlayer(playerId: string): Promise<any> {
		return this.executeGetRequest("player/inspect/" + playerId).then((data: any) => {
			if (data.player) {
				return Promise.resolve(data.player);
			} else {
				return Promise.reject("Invalid data for player!");
			}
		});
	}

	loadVoyage(voyageId: number, newOnly: boolean = true): Promise<any> {
		return this.executePostRequest("voyage/refresh", { voyage_status_id: voyageId, new_only: newOnly }).then((data: any) => {
			if (data) {
				let voyageNarrative: any[] = [];

				data.forEach((action: any) => {
					if (action.character) {
						// TODO: if DB adds support for more than one voyage at a time this hack won't work
						this._playerData.player.character.voyage[0] = mergeDeep(this._playerData.player.character.voyage[0], action.character.voyage[0]);
					}
					else if (action.voyage_narrative) {
						voyageNarrative = action.voyage_narrative;
					}
				});

				//console.info("Loaded voyage info");
				return Promise.resolve(voyageNarrative);
			} else {
				return Promise.reject("Invalid data for voyage!");
			}
		});
	}

	recallVoyage(voyageId: number): Promise<void> {
		return this.executePostRequest("voyage/recall", { voyage_status_id: voyageId }).then((data: any) => {
			if (data) {
				//console.info("Recalled voyage");
				return Promise.resolve();
			} else {
				return Promise.reject("Invalid data for voyage!");
			}
		});
	}

	completeVoyage(voyageId: number): Promise<void> {
		return this.executePostRequest("voyage/complete", { voyage_status_id: voyageId }).then((data: any) => {
			if (data) {
				//console.info("Recalled voyage");
				return this.executePostRequest("voyage/claim", { voyage_status_id: voyageId }).then((data: any) => {
					if (data) {
						//console.info("Recalled voyage");
						return Promise.resolve();
					} else {
						return Promise.reject("Invalid data for voyage!");
					}
				});
			} else {
				return Promise.reject("Invalid data for voyage!");
			}
		});
	}

	reviveVoyage(voyageId: number): Promise<void> {
		return this.executePostRequest("voyage/revive", { voyage_status_id: voyageId }).then((data: any) => {
			if (data) {
				//console.info("Revived voyage");
				return Promise.resolve();
			} else {
				return Promise.reject("Invalid data for voyage!");
			}
		});
	}

	resolveDilemma(voyageId: number, dilemmaId: number, index: number): Promise<void> {
		return this.executePostRequest("voyage/resolve_dilemma", { voyage_status_id: voyageId, dilemma_id: dilemmaId, resolution_index: index }).then((data: any) => {
			if (data) {
				//console.info("Resolved dilemma");
				return Promise.resolve();
			} else {
				return Promise.reject("Invalid data for voyage!");
			}
		});
	}

	startVoyage(voyageSymbol: string, shipId: number, shipName: string, selectedCrewIds: Array<number>): Promise<void> {
		return this.executePostRequest("voyage/start", {
			voyage_symbol: voyageSymbol,
			ship_id: shipId,
			crew_ids_string: selectedCrewIds.join(','),
			ship_name: shipName
		}).then((data: any) => {
			if (data) {
				//console.info("Started voyage");

				data.forEach((action: any) => {
					if (action.character && action.character.voyage) {
						this._playerData.player.character.voyage = action.character.voyage;
					}
				});

				return Promise.resolve();
			} else {
				return Promise.reject("Invalid data for voyage!");
			}
		});
	}

	enterGauntlet(gauntletId: number, crewIds: Array<number>): Promise<void> {
		return this.executePostRequest("gauntlet/enter_crew_contest_gauntlet", {
			gauntlet_id: gauntletId,
			crew1_id:crewIds[0],
			crew2_id:crewIds[1],
			crew3_id:crewIds[2],
			crew4_id:crewIds[3],
			crew5_id:crewIds[4]
		}).then((data: any) => {
			if (data) {
				//console.info("Entered gauntlet");
				return Promise.resolve();
			} else {
				return Promise.reject("Invalid data for gauntlet!");
			}
		});
	}

	submitUserFeedback(feedback: any): Promise<any> {
		return this._net.postjson(CONFIG.URL_USERFEEDBACK, feedback);
	}

	getGithubReleases(): Promise<any> {
		return this._net.get(CONFIG.URL_GITHUBRELEASES, {})
	}
}