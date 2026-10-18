import { MedusaService } from "@medusajs/framework/utils"
import Scholar from "./models/scholar"
import Project from "./models/project"
import Application from "./models/application"
import Submission from "./models/submission"
import Payout from "./models/payout"

class EarnModuleService extends MedusaService({
  Scholar,
  Project,
  Application,
  Submission,
  Payout,
}) {}

export default EarnModuleService
