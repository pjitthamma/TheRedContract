import { handler as legacy } from "../legacy-functions/submit-questionnaire-result";
import { withBackend } from "../shared/backend";
export const handler = withBackend("submit-questionnaire-result", legacy);
