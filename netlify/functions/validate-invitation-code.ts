import { handler as legacy } from "../legacy-functions/validate-invitation-code";
import { withBackend } from "../shared/backend";
export const handler = withBackend("validate-invitation-code", legacy);
