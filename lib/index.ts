export { STTApiClass } from "./STTApi";
export { mergeDeep } from './ObjectMerge';
export { loginSequence } from './LoginSequence';
export { loadFullTree } from './EquipmentTools';
export { bestVoyageShip, loadVoyage, startVoyage } from './VoyageTools';
export { loadGauntlet, gauntletCrewSelection, gauntletRoundOdds, payToGetNewOpponents, playContest } from './GauntletTools';
export { ImageCache } from './ImageProvider';
export { formatCrewStats } from './CrewTools';
import CONFIG from "./CONFIG";
export { CONFIG }

import { STTApiClass } from "./STTApi";
let STTApi = new STTApiClass();
export default STTApi;