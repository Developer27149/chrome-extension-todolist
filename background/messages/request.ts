import { subDays } from "date-fns"

import type { PlasmoMessaging } from "@plasmohq/messaging"

import { getAllTaskType, getTodoList } from "~utils/services"

const handler: PlasmoMessaging.MessageHandler<{
  type: string
  [k: string]: string
}> = async (_, res) => {
  const [taskTypeList, todoList] = await Promise.all([
    getAllTaskType(),
    getTodoList({
      // typeId: taskTypeList[0].typeId,
      page: 1,
      pageSize: 100,
      // status: ETaskStatus.未完成,
      startTime: subDays(Date.now(), 30).getTime(),
      endTime: Date.now()
    })
  ])

  return res.send({
    taskTypeList,
    todoList: todoList.result
  })
}

export default handler
