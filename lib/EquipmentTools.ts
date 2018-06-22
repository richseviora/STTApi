import STTApi from "./index";

export function loadFullTree(onProgress: (description: string) => void): Promise<void> {
    let mapEquipment: Set<number> = new Set();
    let missingEquipment: any[] = [];

    STTApi.itemArchetypeCache.archetypes.forEach((equipment: any) => {
        mapEquipment.add(equipment.id);
    });

    // Have we already cached equipment details for the current digest (since the last recipe update)?
    return STTApi.equipmentCache.where('digest').equals(STTApi.serverConfig.config.craft_config.recipe_tree.digest).first((entry: any) => {
        if (entry) {
              // Merge the cached equipment, since the recipe tree didn't change since our last load
            STTApi.itemArchetypeCache.archetypes = STTApi.itemArchetypeCache.archetypes.concat(entry.archetypeCache);

            // Remove the duplicates
            STTApi.itemArchetypeCache.archetypes = STTApi.itemArchetypeCache.archetypes.filter((obj: any, pos: number, arr: any[]) => {
                return arr.map((mapObj: any) => mapObj.id).indexOf(obj.id) === pos;
            });
        }

        // Search for all equipment in the recipe tree
        STTApi.itemArchetypeCache.archetypes.forEach((equipment: any) => {
            if (equipment.recipe && equipment.recipe.demands && (equipment.recipe.demands.length > 0)) {
                equipment.recipe.demands.forEach((item: any) => {
                    if (!mapEquipment.has(item.archetype_id)) {
                        missingEquipment.push(item.archetype_id);
                    }
                });
            }
        });

        // Search for all equipment currently assigned to crew
        STTApi.roster.forEach((crew: any) => {
            crew.equipment_slots.forEach((es:any) => {
                if (!mapEquipment.has(es.archetype)) {
                    missingEquipment.push(es.archetype);
                }
            });
        });

        onProgress(`Loading equipment... (${missingEquipment.length} remaining)`);
        if (missingEquipment.length == 0) {
            // We're done loading, let's cache the current list, to save on future loading time
            return STTApi.equipmentCache.put({
				digest: STTApi.serverConfig.config.craft_config.recipe_tree.digest,
				archetypeCache: STTApi.itemArchetypeCache.archetypes
			}).then(() => {
				return Promise.resolve();
			});
        }

        return STTApi.executeGetRequest("item/description", { ids: missingEquipment.slice(0,20) }).then((data: any) => {
            if (data.item_archetype_cache && data.item_archetype_cache.archetypes) {
                STTApi.itemArchetypeCache.archetypes = STTApi.itemArchetypeCache.archetypes.concat(data.item_archetype_cache.archetypes);
                return loadFullTree(onProgress);
            }

            // We're done loading, let's cache the current list, to save on future loading time
            return STTApi.equipmentCache.put({
				digest: STTApi.serverConfig.config.craft_config.recipe_tree.digest,
				archetypeCache: STTApi.itemArchetypeCache.archetypes
			}).then(() => {
				return Promise.resolve();
			});
        });
    });
}