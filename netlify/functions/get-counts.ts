import { handler as legacy } from "../legacy-functions/get-counts";
import { withBackend } from "../shared/backend";
export const handler = withBackend("get-counts", legacy);
