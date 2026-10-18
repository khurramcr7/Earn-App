import { Module } from "@medusajs/framework/utils"
import EarnModuleService from "./service"

export const EARN_MODULE = "earn"

export default Module(EARN_MODULE, {
  service: EarnModuleService,
})
