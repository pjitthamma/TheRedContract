import { handler as legacy } from "../legacy-functions/preview-questionnaire-result";
import { withBackend } from "../shared/backend";
export const handler = withBackend("preview-questionnaire-result", legacy);
