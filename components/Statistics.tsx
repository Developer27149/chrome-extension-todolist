import { BsJournalCheck, BsListTask } from "react-icons/bs"
import {
  configAtom,
  taskTypeListAtom,
  todoListAtom,
  userInfoAtom
} from "~utils/store"

import Avatar from "./Avatar"
import { ETaskStatus } from "~utils/types"
import { Pie } from "chart.xkcd-react"
import { calcTodoCountInWeek } from "~utils"
import chartXkcd from "chart.xkcd"
import clsx from "clsx"
import { startOfDay } from "date-fns"
import { useAtom } from "jotai"
import { useMemo } from "react"

export default function Statistics() {
  const [userInfo] = useAtom(userInfoAtom)
  const [todoList] = useAtom(todoListAtom)
  const [taskTypeList] = useAtom(taskTypeListAtom)

  const trendData = useMemo(() => {
    const todayTasks = todoList.filter(
      (item) => Number(item.createTime) > startOfDay(new Date()).getTime()
    )

    const doneTaskCount = todoList.filter(
      (item) => item.status === ETaskStatus.已完成
    ).length

    const { result, exprResult } = calcTodoCountInWeek(todoList)

    return {
      new: {
        isIncrease: todayTasks.length > 0,
        value: todayTasks.length
      },
      all: {
        done: doneTaskCount,
        undone: todoList.length - doneTaskCount
      },
      result,
      exprResult
    }
  }, [todoList])

  return (
    <div className="rounded-md flex items-center gap-4 p-4">
      <div className="bg-[#db4c3f] text-white p-4 rounded-md">
        <div className="flex flex-col justify-center items-center my-4">
          <Avatar name={userInfo.username} rawAvatarUrl={userInfo.avatar} />
          <div className="text-center text-[18px] font-bold">
            {userInfo.username}
          </div>
        </div>
        <div className="flex gap-4">
          <div className="bg-white text-[#d04b22] p-4 rounded-md w-[125px]">
            <div className="flex items-center pr-1">
              <span className={clsx("p-1 rounded-full font-bold")}>
                <BsJournalCheck />
              </span>
              <span>新任务</span>
            </div>
            <div className="text-center text-[48px] font-bold mt-2">
              {trendData.new.value}
            </div>
          </div>
          <div className="bg-white text-[#d04b22] p-4 rounded-md w-[125px]">
            <div className="flex items-center pr-1">
              <span className={clsx("p-1 rounded-full font-bold")}>
                <BsListTask />
              </span>
              <span>未完成</span>
            </div>
            <div className="text-center text-[48px] font-bold mt-2">
              {trendData.all.undone}
            </div>
          </div>
        </div>
      </div>
      <div className="w-[500px] cursor-pointer">
        {/* 数据新增 */}
        <Pie
          config={{
            title: "任务标签分析", // optional
            data: {
              labels: taskTypeList.map((i) => i.typeName),
              datasets: [
                {
                  data: taskTypeList.map((i) => {
                    const typeId = i.typeId
                    return todoList.filter((item) => item.typeId === typeId)
                      .length
                  })
                }
              ]
            },
            options: {
              // optional
              innerRadius: 0.5,
              legendPosition: chartXkcd.config.positionType.upRight
            }
          }}
        />
      </div>
    </div>
  )
}
