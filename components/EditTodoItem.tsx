import clsx from "clsx"
import { useAtom } from "jotai"
import { useEffect, useState } from "react"
import { AiOutlineLoading3Quarters } from "react-icons/ai"
import { BsCalendar2Check } from "react-icons/bs"
import { IoCloseOutline } from "react-icons/io5"

import { sendToBackground } from "@plasmohq/messaging"

import {
  calcExprIndex,
  calcExprTimeByIndex,
  exprDateOptions,
  onClickStopPropagation
} from "~utils"
import { onCreateNewTodoItem, onModifyTodoItem } from "~utils/services"
import { editModelAtom, taskTypeListAtom } from "~utils/store"
import { todoListAtom } from "~utils/store"

interface IProps {
  onClose: () => void
}
export default function EditTodoItem({ onClose }: IProps) {
  const [editModal] = useAtom(editModelAtom)
  const [taskTypeList, setTaskTypeList] = useAtom(taskTypeListAtom)
  const [, setTodoList] = useAtom(todoListAtom)
  const [errorMsg, setErrorMsg] = useState<string>("")
  const [selectTypeId, setSelectTypeId] = useState<number>(
    editModal.data?.typeId ?? taskTypeList?.[0]?.typeId ?? -1
  )
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isCreating, setIsCreating] = useState<boolean>(false)
  const defaultForm = {
    taskName: editModal.data?.taskName ?? "",
    taskContent: editModal.data?.taskContent ?? ""
  }
  const [form, setForm] = useState(defaultForm)
  const [isSetExprDate, setIsSetExprDate] = useState<boolean>(
    !!editModal.data?.expectTime
  )

  const [exprDateIndex, setExprDateIndex] = useState<number>(
    calcExprIndex(editModal.data?.expectTime)
  )

  /**
   * create new type
   * @param newType string
   * @returns
   */
  const onPressKeyEnter = async (newType: string) => {
    try {
      if (newType.length === 0 && isLoading) return
      setIsLoading(true)
      const _newType = await sendToBackground({
        name: "createTaskType",
        body: {
          typeName: newType
        }
      })
      setTaskTypeList([...taskTypeList, _newType])
      onClose()
    } catch (error) {
      console.log("create task type fail:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async () => {
    try {
      if (!selectTypeId) {
        setErrorMsg("请选择一个事项标签吧，方便后续按分类查看")
        return
      }
      if (!form.taskName) {
        setErrorMsg("输入一个简洁的标题吧")
        return
      }
      // if (!form.taskContent) {
      //   setErrorMsg("输入事项描述吧，以免后续忘记关键内容")
      //   return
      // }
      setIsCreating(true)
      // create a new todo item or update a todo item

      if (editModal.data) {
        // update a todo item
        const newTodoItem = {
          ...editModal.data,
          ...form,
          typeId: selectTypeId,
          status: editModal.data.status,
          expectTime: calcExprTimeByIndex(exprDateIndex),
          taskId: editModal.data.taskId
        }
        onModifyTodoItem(newTodoItem)
        setTodoList((todo) => {
          return todo.map((i) => {
            if (i.taskId === newTodoItem.taskId)
              return {
                ...newTodoItem,
                typeMessage: taskTypeList.find(
                  (type) => type.typeId === selectTypeId
                )
              }
            return i
          })
        })
      } else {
        const newTodoItem = await onCreateNewTodoItem({
          ...form,
          typeId: selectTypeId,
          expectTime: calcExprTimeByIndex(exprDateIndex)
        })
        setTodoList((i) => [newTodoItem, ...i])
      }
    } catch (error) {
      console.error("create todo item error:", error)
    } finally {
      setIsCreating(false)
      onClose()
    }
  }

  useEffect(() => {
    // init type id
    if (taskTypeList?.length > 0 && selectTypeId === -1) {
      setSelectTypeId(taskTypeList[0].typeId)
    }
  }, [taskTypeList])

  return (
    <div
      className="absolute inset-0 bg-[#2f2f2f20] z-30 flex justify-center items-center"
      onClick={onClickStopPropagation}>
      <div className="p-4 pl-6 border-2 border-gray-100 w-[600px] m-4 rounded-md  bg-white custom-shadow scale-in">
        <div className="flex items-center gap-4 pb-4">
          <input
            type="text"
            placeholder="标题"
            className="p-2 rounded-sm border-none outline-none text-[14px] flex-grow"
            autoFocus
            value={form.taskName}
            onChange={(e) => setForm({ ...form, taskName: e.target.value })}
            onBlur={() => setErrorMsg("")}
          />
          <IoCloseOutline
            className="relative bottom-3 left-2 cursor-pointer p-[4px] rounded-full hover:bg-gray-100 transition-all text-[24px]"
            onClick={onClose}
          />
        </div>
        <textarea
          value={form.taskContent}
          onChange={(e) => setForm({ ...form, taskContent: e.target.value })}
          onBlur={() => setErrorMsg("")}
          rows={4}
          placeholder="我得去做点什么..."
          className="p-2 rounded-md bg-gray-50 w-full text-[13px] focus-visible:outline-gray-100 text-gray-500 resize-none"
        />
        <div className="flex items-center gap-2 p-2 flex-wrap text-[12px]">
          {taskTypeList &&
            taskTypeList.map(({ typeId, typeName }) => (
              <button
                className={clsx(
                  "p-1 rounded-sm",
                  `${
                    selectTypeId === typeId || selectTypeId === undefined
                      ? "text-white bg-[#d04b22]"
                      : "text-gray-500 bg-white"
                  }`
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectTypeId(typeId)
                }}
                key={typeId}>
                {typeName}
              </button>
            ))}

          {isLoading || taskTypeList.length === 0 ? (
            <AiOutlineLoading3Quarters className="animate-spin" />
          ) : (
            <div
              contentEditable={isLoading === false}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  onPressKeyEnter(e.currentTarget.textContent.trim())
                  e.currentTarget.textContent = "新建"
                }
              }}
              className="p-1 max-w-max text-[#cb5647] outline-dashed outline-transparent rounded-sm focus-visible:outline-[#cb5647]">
              新建
            </div>
          )}
        </div>
        <span
          className={clsx(
            "relative bottom-[1px] mr-4 my-4 flex items-center gap-2  cursor-pointer",
            {
              "text-[#cb5647] opacity-100": isSetExprDate,
              "opacity-40": !isSetExprDate
            }
          )}
          onClick={(e) => {
            e.stopPropagation()
            if (exprDateIndex === -1) {
              setExprDateIndex(0)
            } else {
              setExprDateIndex(-1)
            }
            setIsSetExprDate(!isSetExprDate)
          }}>
          <BsCalendar2Check />
          <span className="text-[12px] relative top-[1px]">截止日期</span>
        </span>
        <div className="flex items-center cursor-pointer gap-2 select-none p-2">
          {isSetExprDate &&
            exprDateOptions.map((tag, index) => (
              <span
                onClick={() => setExprDateIndex(index)}
                className={clsx(
                  "transition-all p-1 rounded-sm border border-gray-50 text-[12px] text-gray-500 item-init",
                  { "text-white bg-[#cb5647]": exprDateIndex === index }
                )}>
                {tag}
              </span>
            ))}
        </div>
        <div className="flex items-center justify-end gap-2 p-2 mt-10 text-[12px]">
          <span
            className="mr-auto text-[#cb5647] h-[12px]"
            style={{ opacity: errorMsg.length }}>
            {errorMsg}
          </span>
          <button
            className="p-1 underline text-gray-500"
            onClick={() => setForm(defaultForm)}>
            重置
          </button>
          <button
            className="p-1 px-2 bg-[#d04b22] text-white rounded-sm"
            onClick={onSubmit}>
            {isCreating ? (
              <div className="flex items-center gap-2">
                <AiOutlineLoading3Quarters className="animate-spin" />
                <span>保存中...</span>
              </div>
            ) : editModal.data ? (
              "保存"
            ) : (
              "创建"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
