import { handler as legacy } from "../legacy-functions/get-mini-game-leaderboard";
import { withBackend } from "../shared/backend";
export const handler = withBackend("get-mini-game-leaderboard", legacy);
