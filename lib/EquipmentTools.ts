import STTApi from "./index";

export async function loadFullTree(onProgress: (description: string) => void): Promise<void> {
    let mapEquipment: Set<number> = new Set();
    let missingEquipment: any[] = [];

    STTApi.itemArchetypeCache.archetypes.forEach((equipment: any) => {
        mapEquipment.add(equipment.id);
    });

    // Have we already cached equipment details for the current digest (since the last recipe update)?
    let entry = await STTApi.equipmentCache.where('digest').equals(STTApi.serverConfig.config.craft_config.recipe_tree.digest).first();

    if (entry) {
        // Merge the cached equipment, since the recipe tree didn't change since our last load
        entry.archetypeCache.forEach((cacheEntry: any) => {
            if (!mapEquipment.has(cacheEntry.id)) {
                STTApi.itemArchetypeCache.archetypes.push(cacheEntry);
                mapEquipment.add(cacheEntry.id);
            }
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
        let lastEquipmentLevel = 1;
        crew.equipment_slots.forEach((es:any) => {
            if (!mapEquipment.has(es.archetype)) {
                missingEquipment.push(es.archetype);
            }

            lastEquipmentLevel = es.level;
        });

        // TODO: This doesn't work - it looks like DB doesn't allow you to query an item's details (such as recipe) if you don't yet own the respective crew at the right level yet
        // Search for all equipment assignable to the crew at all levels
        /*let rc = STTApi.allcrew.find((c: any) => c.symbol === crew.symbol);

        if (rc) {
            rc.equipment_slots.forEach((es:any) => {
                if ((es.level >= lastEquipmentLevel) && !mapEquipment.has(es.archetype)) {
                    missingEquipment.push(es.archetype);
                }
            });
        }*/
    });

    onProgress(`Loading equipment... (${missingEquipment.length} remaining)`);
    if (missingEquipment.length === 0) {
        // We're done loading, let's cache the current list, to save on future loading time
        /*await*/ STTApi.equipmentCache.put({
            digest: STTApi.serverConfig.config.craft_config.recipe_tree.digest,
            archetypeCache: STTApi.itemArchetypeCache.archetypes
        });

        return;
    }

    // Load the description for the missing equipment
    let archetypes = await loadItemsDescription(missingEquipment.slice(0,20));

    if (archetypes.length > 0) {
        STTApi.itemArchetypeCache.archetypes = STTApi.itemArchetypeCache.archetypes.concat(archetypes);
        return loadFullTree(onProgress);
    }

    // We're done loading, let's cache the current list, to save on future loading time
    /*await*/ STTApi.equipmentCache.put({
        digest: STTApi.serverConfig.config.craft_config.recipe_tree.digest,
        archetypeCache: STTApi.itemArchetypeCache.archetypes
    });
}

async function loadItemsDescription(ids: number[]): Promise<any[]> {
    let archetypes: any[] = [];
    try
    {
        // Load the description for the missing equipment
        let data = await STTApi.executeGetRequest("item/description", { ids });

        if (data.item_archetype_cache && data.item_archetype_cache.archetypes) {
            archetypes = data.item_archetype_cache.archetypes;
        }
    }
    catch(error)
    {
        // Some equipment is causing the server to choke, time to binary search the culprit
        if (ids.length === 1) {
            console.error(`The description for item ${ids[0]} fails to load.`);
        } else {
            let leftSide = ids.splice(0,Math.ceil(ids.length / 2));

            let leftArchetypes = await loadItemsDescription(leftSide);
            let rightArchetypes = await loadItemsDescription(ids);

            archetypes = leftArchetypes.concat(rightArchetypes);
        }
    }

    return archetypes;
}