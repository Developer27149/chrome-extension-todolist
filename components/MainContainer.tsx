import clsx from "clsx"
import { useAtom, useSetAtom } from "jotai"
import { useEffect, useMemo, useState } from "react"
import { AiFillGithub, AiOutlineHome } from "react-icons/ai"
import { BsPlusSquareDotted } from "react-icons/bs"
import { CiLogout } from "react-icons/ci"
import { IoCloseOutline, IoRefreshOutline } from "react-icons/io5"

import {
  getTagColorFunction,
  onClickStopPropagation,
  readCacheOrRefetch,
  writeCache
} from "~utils"
import { GITHUB } from "~utils/config"
import { HOMEPAGE } from "~utils/config"
import { getInitData } from "~utils/services"
import {
  configAtom,
  editModelAtom,
  taskTypeListAtom,
  todoListAtom,
  userInfoAtom
} from "~utils/store"
import { ETaskStatus } from "~utils/types"
import type { IUserInfo } from "~utils/types"

import EditTodoItem from "./EditTodoItem"
import Loading from "./Loading"
import Statistics from "./Statistics"
import TodoItem from "./TodoItem"

const getColor = getTagColorFunction()

export default function MainContainer({
  onDisActive,
  onDisReady
}: {
  onDisActive: () => void
  onDisReady: () => void
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [todoList, setTodoList] = useAtom(todoListAtom)
  const [, setTaskType] = useAtom(taskTypeListAtom)
  const [offset, setOffset] = useState(2)
  const [status, setStatus] = useState(ETaskStatus.未完成)
  const [editModal, setEditModal] = useAtom(editModelAtom)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const setUserInfo = useSetAtom(userInfoAtom)
  const [config] = useAtom(configAtom)

  const currentTodoList = useMemo(() => {
    return todoList.filter(
      (item) => status === ETaskStatus.全部 || item.status === status
    )
  }, [todoList, status])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const { todoList = [], taskTypeList = [] } = await readCacheOrRefetch()
        setTaskType(taskTypeList)
        setTodoList(todoList)
      } catch (error) {
        console.log("fetch data fail:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const onSwitchStatus = (isFinish?: boolean) => {
    if (isFinish === true) {
      setStatus(ETaskStatus.已完成)
      setOffset(57)
    } else if (isFinish === false) {
      setStatus(ETaskStatus.未完成)
      setOffset(2)
    } else {
      setStatus(ETaskStatus.全部)
      setOffset(108)
      setStatus(ETaskStatus.全部)
    }
  }

  const onRefreshData = async () => {
    try {
      setIsRefreshing(true)
      const { todoList, taskTypeList } = await getInitData()
      setTodoList(todoList)
      setTaskType(taskTypeList)
      writeCache(taskTypeList, todoList)
    } catch (error) {
      console.log("refresh data fail:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const onExit = () => {
    // clear token and cache
    chrome.storage.sync.clear().then(() => {
      setUserInfo({} as IUserInfo)
      onDisReady()
    })
  }

  return (
    <div
      className="w-[80vw] max-w-[922px] min-h-[400px] max-h-[min(860px, 90vh)] bg-white rounded-md custom-shadow relative overflow-hidden"
      onClick={onClickStopPropagation}>
      <div className="flex items-center border-b border-gray-100 p-4 group relative">
        <a
          href={HOMEPAGE}
          target="_blank"
          className="flex gap-2 items-center mr-auto">
          <AiOutlineHome className="text-[#cb5647]" />
          待办事项
        </a>
        <span className="transition-all translate-y-[-48px] group-hover:translate-y-0 absolute right-[96px] text-[20px]">
          <a href={GITHUB} target="_blank">
            <AiFillGithub />
          </a>
        </span>
        <CiLogout
          className={clsx(
            "cursor-pointer p-[4px] rounded-full hover:bg-gray-100 transition-all text-[24px] mr-1 relative top-[1px]"
          )}
          onClick={onExit}
        />
        <IoRefreshOutline
          className={clsx(
            { "animate-spin": isRefreshing },
            "cursor-pointer p-[4px] rounded-full hover:bg-gray-100 transition-all text-[24px]"
          )}
          onClick={onRefreshData}
        />
        <IoCloseOutline
          className="cursor-pointer p-[4px] rounded-full hover:bg-gray-100 transition-all text-[24px]"
          onClick={onDisActive}
        />
      </div>
      {isLoading ? (
        <Loading />
      ) : (
        <div
          className="overflow-scroll pb-[60px] scrollbar transition-all ease-linear"
          style={{ height: "calc(min(860px, 90vh) - 107px)" }}>
          <Statistics />
          {currentTodoList.length > 0 ? (
            currentTodoList
              .filter((item) => {
                if (config.currentTag === "") return true
                return (
                  item?.typeMessage?.typeName?.trim() ===
                  config.currentTag.trim()
                )
              })
              .map((item, idx) => (
                <TodoItem
                  tagColor={getColor(`${item?.typeMessage?.typeId ?? "-"}`)}
                  key={item.taskId}
                  item={item}
                  styles={{ animationDelay: `${idx * 100}ms` }}
                />
              ))
          ) : (
            <div className="h-[300px] flex justify-center items-center">
              <span className="text-gray-300">空空如也...</span>
            </div>
          )}
        </div>
      )}

      <div className="bottom-menu">
        <div className="mr-auto flex relative p-[2px] border border-[#cb5647] rounded-full text-[13px]">
          <button
            className="p-1 px-2 rounded-sm z-10"
            style={{
              color: status === ETaskStatus.未完成 ? "white" : "#cb5647"
            }}
            onClick={() => onSwitchStatus(false)}>
            未完成
          </button>
          <button
            className="p-1 px-2 rounded-sm z-10"
            style={{
              color: status === ETaskStatus.已完成 ? "white" : "#cb5647"
            }}
            onClick={() => onSwitchStatus(true)}>
            已完成
          </button>
          <button
            className="p-1 px-2 rounded-sm z-10"
            style={{ color: status === ETaskStatus.全部 ? "white" : "#cb5647" }}
            onClick={() => onSwitchStatus()}>
            全&nbsp;部&nbsp;
          </button>
          <span
            className="w-[33.333%] absolute transition-all bg-[#cb5647] rounded-[28px] bottom-[2px] top-[2px]"
            style={{ left: `${offset}px` }}></span>
        </div>
        <button
          className="p-1 text-md text-[#cb5647] flex items-center gap-2"
          onClick={() =>
            editModal.visible === false &&
            setEditModal({ visible: true, data: undefined })
          }>
          <BsPlusSquareDotted />
          创建待办
        </button>
      </div>
      {editModal.visible && (
        <EditTodoItem
          onClose={() => setEditModal({ visible: false, data: undefined })}
        />
      )}
    </div>
  )
}
