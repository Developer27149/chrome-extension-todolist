import { sendToBackground } from "@plasmohq/messaging"

import { generateHashPassword, request } from "./"
import type {
  IAddTodoItemParams,
  IGetTodoListPrams,
  ITaskType,
  IUpdateTodoItemParams,
  IUserInfo
} from "./types"
import type { IPaginationData } from "./types"
import type { ITodoItem } from "./types"

const API_URL = "https://api.jimmyxuexue.top"

export const getAllTaskType = () =>
  request<ITaskType[]>(`${API_URL}/taskType/list`)

export const getTodoList = (params: IGetTodoListPrams) =>
  request<IPaginationData<ITodoItem>>(`${API_URL}/task/list/`, {
    body: JSON.stringify(params)
  })

export const createNewTaskType = (typeName: string) =>
  request<ITaskType>(`${API_URL}/taskType/add`, {
    body: JSON.stringify({
      typeName,
      desc: "来自插件的匿名描述，反正你也用不上"
    })
  })

export const getInitData = async () => {
  const data = await sendToBackground({
    name: "request",
    body: {
      type: "init"
    }
  })
  return data as {
    taskTypeList: ITaskType[]
    todoList: ITodoItem[]
  }
}

export const login = (phone: string, password: string) =>
  request<{
    token: string
    user: IUserInfo
  }>(`${API_URL}/user/login`, {
    body: JSON.stringify({ phone, password })
  })

export const onLogin = async (phone: string, password: string) => {
  const { token, user } = await sendToBackground({
    name: "login",
    body: {
      phone,
      password: generateHashPassword(password)
    }
  })
  return {
    token,
    user
  } as {
    token: string
    user: IUserInfo
  }
}

export const createNewTodoItem = (params: IAddTodoItemParams) =>
  request<ITodoItem>(`${API_URL}/task/add`, {
    body: JSON.stringify(params)
  })

export const onCreateNewTodoItem = async (body: IAddTodoItemParams) => {
  const data = await sendToBackground({
    name: "createTodoItem",
    body
  })
  return data as ITodoItem
}

export const modifyTodoItem = (params: IUpdateTodoItemParams) =>
  request<ITodoItem>(`${API_URL}/task/update`, {
    body: JSON.stringify(params)
  })

export const onModifyTodoItem = async (body: IUpdateTodoItemParams) => {
  return sendToBackground({
    name: "modifyTodoItem",
    body
  }) as Promise<ITodoItem>
}

export const removeTodoItem = (taskId: number) =>
  request(`${API_URL}/task/del`, {
    body: JSON.stringify({ taskId })
  })

export const onRemoveTodoItem = async (taskId: number) => {
  return sendToBackground({
    name: "removeTodoItem",
    body: {
      taskId
    }
  })
}
