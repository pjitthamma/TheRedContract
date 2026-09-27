import { handler as legacy } from "../legacy-functions/get-questionnaire";
import { withBackend } from "../shared/backend";
export const handler = withBackend("get-questionnaire", legacy);
