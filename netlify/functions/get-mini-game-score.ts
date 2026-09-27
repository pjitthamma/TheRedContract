import { handler as legacy } from "../legacy-functions/get-mini-game-score";
import { withBackend } from "../shared/backend";
export const handler = withBackend("get-mini-game-score", legacy);
