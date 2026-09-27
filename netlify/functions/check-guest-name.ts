import { handler as legacy } from "../legacy-functions/check-guest-name";
import { withBackend } from "../shared/backend";
export const handler = withBackend("check-guest-name", legacy);
