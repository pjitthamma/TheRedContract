import { handler as legacy } from "../legacy-functions/submit-mini-game-score";
import { withBackend } from "../shared/backend";
export const handler = withBackend("submit-mini-game-score", legacy);
