import { handler as legacy } from "../legacy-functions/track-event";
import { withBackend } from "../shared/backend";
export const handler = withBackend("track-event", legacy);
