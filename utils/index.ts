import type { ITaskType, ITodoItem, IUserInfo } from "./types"
import { addDays, addMinutes, isBefore } from "date-fns"

import bcrypt from "bcryptjs"
import { getInitData } from "./services"
import { is } from "date-fns/locale"

export const request = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  const { token } = await chrome?.storage?.sync?.get?.("token")
  options.headers = options.headers ?? {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  }
  options.method = options?.method ?? "POST"
  options.credentials = "omit"

  const response = await fetch(url, options)
  const jsonValue = await response.json()

  if (jsonValue.code === 401) {
    throw new Error("请先登录")
  } else if (jsonValue.code === 10000) {
    throw new Error("账号密码错误")
  } else if (jsonValue.code !== 200) {
    throw new Error(jsonValue.message)
  } else {
    return jsonValue.result as T
  }
}

export const onClickPreventDefault = (e: React.MouseEvent) => {
  e.preventDefault()
}

export const onClickStopPropagation = (e: React.MouseEvent) => {
  e.stopPropagation()
}

export const generateHashPassword = (password: string) => {
  const SALT_ROUNDS = 10
  return bcrypt.hashSync(password, SALT_ROUNDS)
}

export const exprDateOptions = ["今天", "三天内", "本周"]

export const calcExprIndex = (exprTime?: number | string) => {
  if (!exprTime) return -1
  const now = new Date()
  const expr = new Date(Number(exprTime))
  const diff = Math.ceil(
    (expr.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )
  if (diff <= 1) return 0
  if (diff <= 3) return 1
  if (diff <= 7) return 2
  return -1
}

export const isExprTimeExpired = (exprTime?: number | string) => {
  if (!exprTime) return false
  const now = new Date()
  const expr = new Date(Number(exprTime))
  return now > expr
}

export const formatTimestamp = (timestamp?: number | string) => {
  try {
    if (!timestamp) return "-"
    const _ts = Number(timestamp)
    const date = new Date(_ts)
    return `${date.getMonth() + 1}月${date.getDate()}日`
  } catch (error) {
    console.error("format date fail:", timestamp, error)
    return "-"
  }
}

export const calcTodoExprTime = (exprTime?: number | string) => {
  const _exprTime = formatTimestamp(exprTime)
  if (_exprTime === "-") return "-"
  const now = new Date()
  const expr = new Date(Number(exprTime))
  if (now > expr) return "已过期"
  return `剩余${Math.ceil(
    (expr.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )}天`
}

export const calcExprTimeByIndex = (index: number) => {
  const record = {
    "-1": "",
    0: addDays(new Date(), 1).valueOf(),
    1: addDays(new Date(), 3).valueOf(),
    2: addDays(new Date(), 7).valueOf()
  }
  return `${record[index]}`
}

// 七天内任务数量
export const calcTodoCountInWeek = (todoList: ITodoItem[]) => {
  const result = [0, 0, 0, 0, 0, 0, 0]
  const exprResult = [0, 0, 0, 0, 0, 0, 0]
  todoList.forEach((todo) => {
    const { expectTime, createTime } = todo
    const _expr = Number(expectTime)
    const _createTime = Number(createTime)
    const now = new Date()

    for (let index = 0; index < result.length; index++) {
      if (!isBefore(addDays(now, -(index + 3)), new Date(_createTime))) {
        result[index + 2] += 1
        if (_expr && !isBefore(addDays(now, -(index + 3)), new Date(_expr))) {
          exprResult[index + 2] += 1
        }
        return
      }
    }
  })
  return {
    result,
    exprResult
  }
}

// write todo list and all type to localStorage
export const writeCache = async (
  taskTypeList: ITaskType[],
  todoList: ITodoItem[]
) => {
  chrome.storage.local.set({
    taskTypeList,
    todoList
  })
  // set cache expr time to 5 minutes
  const expr = addMinutes(new Date(), 5).valueOf()
  chrome.storage.local.set({ expr })
}

// read localStorage's data cache
export const readCacheOrRefetch = async () => {
  const { expr } = (await chrome.storage.local.get("expr")) as { expr: number }
  const isExpr = expr && expr > Date.now()
  console.log("isExpr", isExpr, expr)
  if (isExpr !== true) {
    // 发起请求读取数据
    const { taskTypeList, todoList } = await getInitData()
    writeCache(taskTypeList, todoList)
    return {
      taskTypeList,
      todoList
    }
  } else {
    const { taskTypeList, todoList } = (await chrome.storage.local.get([
      "taskTypeList",
      "todoList"
    ])) as { taskTypeList: ITaskType[]; todoList: ITodoItem[] }
    return {
      taskTypeList,
      todoList
    }
  }
}

// get tag color by tag name
export const getTagColorFunction = () => {
  const colorList = [
    "#6366f1",
    "#8b5cf6",
    "#a855f7",
    "#d946ef",
    "#ec4899",
    "#f43f5e",
    "#10b981",
    "#14b8a6",
    "#06b6d4",
    "#0ea5e9",
    "#3b82f6",
    "#64748b",
    "#6b7280",
    "#71717a",
    "#737373",
    "#57534e",
    "#ef4444",
    "#f97316",
    "#f59e0b",
    "#eab308",
    "#84cc16",
    "#22c55e"
  ]
  const colorMap = {}
  return (tagName: string | number = "-") => {
    if (colorMap[tagName]) {
      return colorList[tagName] as string
    } else {
      const color =
        colorList.find((c) => !Object.values(colorMap).includes(c)) ??
        colorList[0]
      colorMap[tagName] = color
      return color
    }
  }
}

// save favicon to localStorage and read it
export const saveFavicon = (origin: string, base64String: string) => {
  return chrome.storage.local.set({
    [origin]: base64String
  })
}

export const getFavicon = async (origin: string) => {
  try {
    const { [origin]: favicon } = await chrome.storage.local.get(origin)
    return favicon
  } catch (error) {
    console.log("get favicon fail", error)
    return null
  }
}

export const resolveStringOrDefaultValue = async (
  value: string | null | undefined | Promise<any>,
  defaultValue: string
) => {
  const _v = await value
  return _v ?? defaultValue
}

export const getFaviconFromTaskName = async (taskName: string) => {
  try {
    const url = taskName.match(/\]\((http.*)\)$/i)?.[1]
    const origin = new URL(url).origin
    const favicon = await getFavicon(origin)
    return resolveStringOrDefaultValue(favicon, "")
  } catch (error) {
    return ""
  }
}
