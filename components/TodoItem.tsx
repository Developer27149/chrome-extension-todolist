import clsx from "clsx"
import { useAtom } from "jotai"
import { marked } from "marked"
import { useEffect, useState } from "react"
import type { CSSProperties } from "react"
import { AiOutlineEdit } from "react-icons/ai"
import { BsCalendar2Check, BsCheck2Circle, BsCircle } from "react-icons/bs"
import { FcTodoList } from "react-icons/fc"

import {
  calcTodoExprTime,
  formatTimestamp,
  getFaviconFromTaskName,
  isExprTimeExpired
} from "~utils"
import { onModifyTodoItem, onRemoveTodoItem } from "~utils/services"
import { configAtom, editModelAtom, todoListAtom } from "~utils/store"
import { ETaskStatus } from "~utils/types"
import type { ITodoItem } from "~utils/types"

import CloseButton from "./CloseButton"

interface IProps {
  item: ITodoItem
  styles?: CSSProperties
  tagColor: string
}
export default function TodoItem({ item, styles, tagColor }: IProps) {
  const { taskName, taskContent, taskId, status, expectTime, typeMessage } =
    item
  const [isLoading, setIsLoading] = useState(false)
  const [, setEditModal] = useAtom(editModelAtom)
  const [, setTodoList] = useAtom(todoListAtom)
  const [favicon, setFavicon] = useState("")
  const [config, setConfig] = useAtom(configAtom)

  const renderHTML = (markdown: string) => {
    return marked.parse(markdown)
  }

  const onChangeStatus = async () => {
    let newTodoItem
    try {
      setIsLoading(true)
      newTodoItem = await onModifyTodoItem({
        ...item,
        status:
          item.status === ETaskStatus.已完成
            ? ETaskStatus.未完成
            : ETaskStatus.已完成
      })
    } catch (error) {
      console.error("change status fail:", error)
    } finally {
      setTimeout(() => {
        setIsLoading(false)
        if (newTodoItem) {
          setTodoList((prev) => {
            return prev.map((item) => {
              if (item.taskId === taskId) {
                return newTodoItem
              }
              return item
            })
          })
        }
      }, 1000)
    }
  }

  const onSetCurrentTag = () => {
    if (config.currentTag !== "") {
      setConfig({ currentTag: "" })
    } else {
      setConfig({ currentTag: typeMessage.typeName.trim() })
    }
  }

  const onClickRemoveBtn = async () => {
    try {
      setIsLoading(true)
      await onRemoveTodoItem(taskId)
    } catch (error) {
      console.error("remove todo item fail:", error)
    } finally {
      setTimeout(() => {
        setIsLoading(false)
        setTodoList((prev) => {
          return prev.filter((item) => item.taskId !== taskId)
        })
      }, 500)
    }
  }

  useEffect(() => {
    getFaviconFromTaskName(taskName).then((favicon) => {
      setFavicon(favicon)
    })
  }, [taskName])

  return (
    <div
      className={clsx(
        { "reverse-status": isLoading, "item-init": !isLoading },
        "todo-item group hover:border-l-[#cb5647] hover:custom-shadow"
      )}
      style={styles}>
      {/* add favicon */}
      <div className="flex justify-center items-center">
        {favicon === "" ? (
          <FcTodoList className="w-[30px] h-[30px]" />
        ) : (
          <img src={favicon} className="w-[30px] h-[30px]" />
        )}
      </div>
      <div className="flex flex-col justify-center">
        <h5
          className="text-[#3e3e3e]"
          dangerouslySetInnerHTML={{ __html: renderHTML(taskName) }}></h5>
        <p
          className={clsx("text-gray-500 text-[13px]", {
            "line-through text-gray-400": status == ETaskStatus.已完成
          })}
          dangerouslySetInnerHTML={{ __html: renderHTML(taskContent) }}></p>
      </div>
      <div
        className="text-[12px] text-white p-0.5 flex gap-1 flex-wrap items-center justify-center"
        style={{ opacity: item.typeMessage?.typeId ? 1 : 0 }}>
        <span
          style={{ background: tagColor }}
          className="p-1 rounded-sm inline-block h-max cursor-pointer"
          onClick={onSetCurrentTag}>
          {item.typeMessage?.typeName}
        </span>
      </div>
      <div>
        <div className="flex gap-2 items-center">
          <BsCalendar2Check />
          <span
            className={clsx({
              "line-through text-gray-400": isExprTimeExpired(expectTime)
            })}>
            {formatTimestamp(expectTime)}
          </span>
        </div>
        <span
          className={clsx(
            { "text-[#d04b22]": isExprTimeExpired(expectTime) },
            "text-[12px]"
          )}>
          {calcTodoExprTime(expectTime)}
        </span>
      </div>
      <div className="flex items-center justify-end gap-2 group-hover:opacity-100 opacity-0 ">
        <button
          onClick={onChangeStatus}
          className={clsx({
            "text-green-600": status === ETaskStatus.已完成
          })}>
          {status === ETaskStatus.已完成 ? (
            <BsCheck2Circle className="transition-all p-[4px] rounded-full hover:bg-gray-100 text-[24px]" />
          ) : (
            <BsCircle className="transition-all p-[4px] rounded-full hover:bg-gray-100 text-[24px]" />
          )}
        </button>
        <AiOutlineEdit
          onClick={() => {
            setEditModal({ visible: true, data: item })
          }}
          className="cursor-pointer p-[4px] rounded-full hover:bg-gray-100 transition-all text-[24px]"
        />
        <CloseButton onClick={onClickRemoveBtn} />
      </div>
    </div>
  )
}
