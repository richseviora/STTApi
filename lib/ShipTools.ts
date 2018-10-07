import STTApi from "./index";

export function matchShips(ships: any): Promise<any> {
	let newShips: any[] = [];
	STTApi.shipSchematics.forEach((schematic: any) => {
		let owned = ships.find((ship: any) => ship.name == schematic.ship.name);
		if (owned) {
			schematic.ship = owned;
		}
		else {
			schematic.ship.level = 0;
			schematic.ship.id = 0;
		}

		if (schematic.ship.traits) {
			schematic.ship.traitNames = schematic.ship.traits.concat(schematic.ship.traits_hidden).map((trait: any) => STTApi.getShipTraitName(trait)).join();
		} else {
			schematic.ship.traitNames = '';
		}

		newShips.push(schematic.ship);
	});

	// Ships with no schematic? Apparently true for constellation class
	ships.forEach((ship: any) => {
		let exists = newShips.find((s: any) => s.name === ship.name);
		if (!exists) {
			if (ship.traits) {
				ship.traitNames = ship.traits.concat(ship.traits_hidden).map((trait: any) => STTApi.getShipTraitName(trait)).join();
			} else {
				ship.traitNames = '';
			}
	
			newShips.push(ship);
		}
	});

	return Promise.resolve(newShips);
}