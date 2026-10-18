import { MedusaService } from "@medusajs/framework/utils"
import Scholar from "./models/scholar"
import Project from "./models/project"
import Application from "./models/application"
import Submission from "./models/submission"
import Payout from "./models/payout"
import Partner from "./models/partner"
import BookProject from "./models/book-project"
import Commitment from "./models/commitment"
import SalesReport from "./models/sales-report"
import Distribution from "./models/distribution"

class EarnModuleService extends MedusaService({
  Scholar,
  Project,
  Application,
  Submission,
  Payout,
  Partner,
  BookProject,
  Commitment,
  SalesReport,
  Distribution,
}) {}

export default EarnModuleService
