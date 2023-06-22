import type { PlasmoMessaging } from "@plasmohq/messaging"

import { createNewTaskType } from "~utils/services"

const handler: PlasmoMessaging.MessageHandler<{
  type: string
  [k: string]: string
}> = async (req, res) => {
  const { typeName } = req.body
  const newType = await createNewTaskType(typeName)
  return res.send(newType)
}

export default handler
