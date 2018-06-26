import STTApi from "./index";
import CONFIG from "./CONFIG";
import { matchCrew } from './CrewTools';
import { matchShips } from './ShipTools';
import { IFoundResult } from './ImageProvider';
import { loadMissionData } from './MissionTools';
import { loadFullTree } from './EquipmentTools';
import { calculateMissionCrewSuccess, calculateMinimalComplementAsync } from './MissionCrewSuccess';

export async function loginSequence(onProgress: (description: string) => void, loadMissions: boolean = true) {
    let mainResources = [
        {
            loader: STTApi.loadCrewArchetypes.bind(STTApi),
            description: 'crew information'
        },
        {
            loader: STTApi.loadServerConfig.bind(STTApi),
            description: 'server configuration'
        },
        {
            loader: STTApi.loadPlatformConfig.bind(STTApi),
            description: 'platform configuration'
        },
        {
            loader: STTApi.loadShipSchematics.bind(STTApi),
            description: 'ship information'
        },
        {
            loader: STTApi.loadPlayerData.bind(STTApi),
            description: 'player data'
        }
    ];

    let fleetResources = [
        {
            loader: STTApi.loadFleetMemberInfo.bind(STTApi),
            description: 'fleet members'
        },
        {
            loader: STTApi.loadFleetData.bind(STTApi),
            description: 'fleet data'
        },
        {
            loader: STTApi.loadStarbaseData.bind(STTApi),
            description: 'starbase data'
        }
    ];

    for (let res of mainResources) {
        onProgress('Loading ' + res.description + '...');
        await res.loader();
    }

    if (STTApi.playerData.fleet && STTApi.playerData.fleet.id != 0) {
        for (let res of fleetResources) {
            onProgress('Loading ' + res.description + '...');
            await res.loader(STTApi.playerData.fleet.id);
        }
    }

    onProgress('Analyzing crew...');
    let roster = await matchCrew(STTApi.playerData.character);

    STTApi.roster = roster;
    roster.forEach((crew: any) => {
        crew.iconUrl = '';
        crew.iconBodyUrl = '';
    });

    let total = roster.length * 2 + STTApi.crewAvatars.length;
    let current = 0;
    onProgress('Caching crew images... (' + current + '/' + total + ')');

    let iconPromises: Array<Promise<void>> = [];
    for (let crew of roster) {
        crew.iconUrl = STTApi.imageProvider.getCrewCached(crew, false);
        if (crew.iconUrl === '') {
            iconPromises.push(STTApi.imageProvider.getCrewImageUrl(crew, false, crew.id).then((found: IFoundResult) => {
                onProgress('Caching crew images... (' + current++ + '/' + total + ')');
                STTApi.roster.forEach((crew: any) => {
                    if (crew.id === found.id)
                        crew.iconUrl = found.url;
                });

                return Promise.resolve();
            }).catch((error: any) => { /*console.warn(error);*/ }));
        } else {
            // Image is already cached

            current++;
            // If we leave this in, stupid React will re-render everything, even though we're in a tight synchronous loop and no one gets to see the updated value anyway
            //onProgress('Caching crew images... (' + current++ + '/' + total + ')');
        }

        crew.iconBodyUrl = STTApi.imageProvider.getCrewCached(crew, true);
        if (crew.iconBodyUrl === '') {
            iconPromises.push(STTApi.imageProvider.getCrewImageUrl(crew, true, crew.id).then((found: IFoundResult) => {
                onProgress('Caching crew images... (' + current++ + '/' + total + ')');
                STTApi.roster.forEach((crew: any) => {
                    if (crew.id === found.id)
                        crew.iconBodyUrl = found.url;
                });

                return Promise.resolve();
            }).catch((error: any) => { /*console.warn(error);*/ }));
        } else {
            // Image is already cached

            current++;
            // If we leave this in, stupid React will re-render everything, even though we're in a tight synchronous loop and no one gets to see the updated value anyway
            //onProgress('Caching crew images... (' + current++ + '/' + total + ')');
        }
    }

    onProgress('Caching crew images... (' + current + '/' + total + ')');

    // Also load the avatars for crew not in the roster
    for (let crew of STTApi.crewAvatars) {
        crew.iconUrl = STTApi.imageProvider.getCrewCached(crew, false);
        if (crew.iconUrl === '') {
            iconPromises.push(STTApi.imageProvider.getCrewImageUrl(crew, false, crew.id).then((found: IFoundResult) => {
                onProgress('Caching crew images... (' + current++ + '/' + total + ')');
                STTApi.crewAvatars.forEach((crew: any) => {
                    if (crew.id === found.id)
                        crew.iconUrl = found.url;
                });

                return Promise.resolve();
            }).catch((error: any) => { /*console.warn(error);*/ }));
        } else {
            // Image is already cached

            current++;
            // If we leave this in, stupid React will re-render everything, even though we're in a tight synchronous loop and no one gets to see the updated value anyway
            //onProgress('Caching crew images... (' + current++ + '/' + total + ')');
        }
    }

    onProgress('Caching crew images... (' + current + '/' + total + ')');

    //await Promise.all(iconPromises);

    onProgress('Loading ships...');

    let ships = await matchShips(STTApi.playerData.character.ships);
    STTApi.ships = ships;

    total += ships.length;
    //current = 0;
    onProgress('Caching ship images... (' + current + '/' + total + ')');
    //iconPromises = [];
    for (let ship of ships) {
        ship.iconUrl = STTApi.imageProvider.getCached(ship);
        if (ship.iconUrl === '') {
            iconPromises.push(STTApi.imageProvider.getShipImageUrl(ship, ship.name).then((found: IFoundResult) => {
                onProgress('Caching ship images... (' + current++ + '/' + total + ')');
                STTApi.ships.forEach((ship: any) => {
                    if (ship.name === found.id)
                        ship.iconUrl = found.url;
                });

                return Promise.resolve();
            }).catch((error: any) => { /*console.warn(error);*/ }));
        } else {
            // Image is already cached

            current++;
            // If we leave this in, stupid React will re-render everything, even though we're in a tight synchronous loop and no one gets to see the updated value anyway
            //onProgress('Caching ship images... (' + current++ + '/' + total + ')');
        }
    }

    onProgress('Caching ship images... (' + current + '/' + total + ')');

    //await Promise.all(iconPromises);

    onProgress('Caching item images...');

    total += STTApi.playerData.character.items.length;
    //current = 0;
    onProgress('Caching item images... (' + current + '/' + total + ')');
    //iconPromises = [];
    for (let item of STTApi.playerData.character.items) {
        item.iconUrl = STTApi.imageProvider.getCached(item);
        item.typeName = item.icon.file.replace("/items", "").split("/")[1];
        item.symbol = item.icon.file.replace("/items", "").split("/")[2];

        if (item.iconUrl === '') {
            iconPromises.push(STTApi.imageProvider.getItemImageUrl(item, item.id).then((found: IFoundResult) => {
                onProgress('Caching item images... (' + current++ + '/' + total + ')');
                STTApi.playerData.character.items.forEach((item: any) => {
                    if (item.id === found.id)
                        item.iconUrl = found.url;
                });

                return Promise.resolve();
            }).catch((error: any) => { /*console.warn(error);*/ }));
        } else {
            // Image is already cached

            current++;
            // If we leave this in, stupid React will re-render everything, even though we're in a tight synchronous loop and no one gets to see the updated value anyway
            //onProgress('Caching item images... (' + current++ + '/' + total + ')');
        }
    }

    onProgress('Caching item images... (' + current + '/' + total + ')');

    //await Promise.all(iconPromises);

    onProgress('Loading equipment...');

    await loadFullTree(onProgress);

    onProgress('Caching images...');

    // Trick the UI into updating (yield)
    await new Promise(resolve => setTimeout(resolve, 50));

    total += STTApi.itemArchetypeCache.archetypes.length;
    //current = 0;
    onProgress('Caching equipment images... (' + current + '/' + total + ')');

    //iconPromises = [];
    for (let equipment of STTApi.itemArchetypeCache.archetypes) {
        equipment.iconUrl = STTApi.imageProvider.getCached(equipment);
        if (equipment.iconUrl === '') {
            iconPromises.push(STTApi.imageProvider.getItemImageUrl(equipment, equipment.id).then((found: IFoundResult) => {
                onProgress('Caching equipment images... (' + current++ + '/' + total + ')');
                STTApi.itemArchetypeCache.archetypes.forEach((item: any) => {
                    if (item.id === found.id)
                        item.iconUrl = found.url;
                });
                return Promise.resolve();
            }).catch((error) => { }));
        } else {
            // Image is already cached

            current++;
            // If we leave this in, stupid React will re-render everything, even though we're in a tight synchronous loop and no one gets to see the updated value anyway
            //onProgress('Caching equipment images... (' + current++ + '/' + total + ')');
        }
    }

    onProgress('Caching equipment images... (' + current + '/' + total + ')');

    //await Promise.all(iconPromises);

    total += Object.keys(CONFIG.SPRITES).length;
    //current = 0;
    onProgress('Caching misc images... (' + current + '/' + total + ')');
    //iconPromises = [];
    for (var sprite in CONFIG.SPRITES) {
        iconPromises.push(STTApi.imageProvider.getSprite(CONFIG.SPRITES[sprite].asset, sprite, sprite).then((found: IFoundResult) => {
            onProgress('Caching misc images... (' + current++ + '/' + total + ')');
            for (var sprite in CONFIG.SPRITES) {
                if (sprite === found.id)
                    CONFIG.SPRITES[sprite].url = found.url;
            }

            return Promise.resolve();
        }).catch((error: any) => { /*console.warn(error);*/ }));
    }

    await Promise.all(iconPromises);

    if (loadMissions) {
        onProgress('Loading missions and quests...');

        // Filter out missions in a bad state (see https://github.com/IAmPicard/StarTrekTimelinesSpreadsheet/issues/31)
        STTApi.playerData.character.accepted_missions = STTApi.playerData.character.accepted_missions.filter((mission: any) => mission.main_story);

        let missions = await loadMissionData(STTApi.playerData.character.cadet_schedule.missions.concat(STTApi.playerData.character.accepted_missions), STTApi.playerData.character.dispute_histories);
        STTApi.missions = missions;

        onProgress('Calculating mission success stats for crew...');
        STTApi.missionSuccess = calculateMissionCrewSuccess();
        calculateMinimalComplementAsync();
    }
}
