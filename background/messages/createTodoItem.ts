import type { PlasmoMessaging } from "@plasmohq/messaging"
import { createNewTodoItem } from "~utils/services"

const handler: PlasmoMessaging.MessageHandler<{
  type: string
  [k: string]: string
}> = async (req, res) => {
  const { typeId, taskName, taskContent, expectTime } = req.body
  return res.send(
    await createNewTodoItem({
      typeId: Number(typeId),
      taskName,
      taskContent,
      expectTime
    })
  )
}

export default handler
