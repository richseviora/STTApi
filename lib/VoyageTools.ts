import STTApi from "./index";
import CONFIG from "./CONFIG";

export function bestVoyageShip(): any[] {
    let voyage = STTApi.playerData.character.voyage_descriptions[0];

    let consideredShips: any[] = [];
    STTApi.ships.forEach((ship: any) => {
        if (ship.id > 0) {
            let entry = {
                ship: ship,
                score: ship.antimatter
            };

            if (ship.traits.find((trait: any) => trait == voyage.ship_trait)) {
                entry.score += 150; // TODO: where is this constant coming from (Config)?
            }

            consideredShips.push(entry);
        }
    });

    consideredShips = consideredShips.sort((a, b) => b.score - a.score);
    consideredShips = consideredShips.filter(entry => entry.score == consideredShips[0].score);

    return consideredShips;
}