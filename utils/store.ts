import { atom, useAtom } from "jotai"

import type { ITaskType, ITodoItem, IUserInfo } from "./types"

const userInfoAtom = atom({} as IUserInfo)
const todoListAtom = atom([] as ITodoItem[])
const taskTypeListAtom = atom([] as ITaskType[])

export const editModelAtom = atom({
  visible: false,
  data: undefined as ITodoItem | undefined
})

const getTodoListByTypeId = (typeId: number) => {
  return atom((get) =>
    get(todoListAtom).filter((item) => item.typeId === typeId)
  )
}

const getTodoTaskById = (taskId: number) => {
  return atom((get) => get(todoListAtom).find((item) => item.taskId === taskId))
}

const removeTodoTaskById = (taskId: number) => {
  const [, setTodoList] = useAtom(todoListAtom)
  setTodoList((i) => i.filter((item) => item.taskId !== taskId))
}

const modifyTodoTaskById = (taskId: number, newTodoTask: ITodoItem) => {
  const [, setTodoList] = useAtom(todoListAtom)
  setTodoList((i) => {
    const index = i.findIndex((item) => item.taskId === taskId)
    if (index !== -1) {
      i[index] = newTodoTask
    }
    return i
  })
}

export {
  userInfoAtom,
  todoListAtom,
  taskTypeListAtom,
  getTodoListByTypeId,
  getTodoTaskById,
  removeTodoTaskById,
  modifyTodoTaskById
}
