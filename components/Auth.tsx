import { BsEye, BsEyeSlash } from "react-icons/bs"
import { getInitData, onLogin } from "~utils/services"
import { taskTypeListAtom, todoListAtom, userInfoAtom } from "~utils/store"
import { useEffect, useState } from "react"

import { AiOutlineLoading3Quarters } from "react-icons/ai"
import { HOMEPAGE } from "~utils/config"
import authSvg from "data-base64:~assets/auth.svg"
import { onClickStopPropagation } from "~utils"
import { useAtom } from "jotai"

export default function Auth({ setAuth }: { setAuth: () => void }) {
  const [, setTaskType] = useAtom(taskTypeListAtom)
  const [, setTodoList] = useAtom(todoListAtom)
  const [userInfo, setUserInfo] = useAtom(userInfoAtom)
  const [showRawPassword, setShowRawPassword] = useState(false)
  const [form, setForm] = useState({
    phone: "",
    password: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault()
      if (isLoading) return
      setIsLoading(true)
      if (form.password.length < 6 || form.phone.length <= 0) {
        setError("手机号或密码不正确")
        return
      }
      const { token, user } = await onLogin(form.phone, form.password)
      const [, { taskTypeList, todoList }] = await Promise.all([
        chrome.storage.sync.set({ token, loginUserData: user }),
        getInitData()
      ])
      setUserInfo(user)
      setTaskType(taskTypeList)
      setTodoList(todoList)
      setAuth()
    } catch (error) {
      console.log("login error:", error)
      // 先一律视为登录失败吧
      setError("手机号或密码不正确")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    chrome.storage.local.get("userInfo").then(({ userInfo }) => {
      form.phone = userInfo.phone
    })
  }, [])
  return (
    <form
      onSubmit={onSubmit}
      onClick={onClickStopPropagation}
      className="flex flex-col w-[60vw] max-w-[900px] h-[400px] pb-12 bg-white rounded-md justify-center custom-shadow relative">
      <div className="w-[300px] z-10 flex flex-col gap-4 p-8 pb-0 absolute left-0 top-0 bottom-0 bg-white rounded-l-md">
        <h3 className="pl-10 pb-8">欢迎回来，{userInfo.phone ?? "朋友"}</h3>

        <div className=" flex gap-2 flex-col">
          <label
            className="w-16 inline-block text-gray-500 text-[14px]"
            htmlFor="phone">
            手机号
          </label>
          <input
            autoComplete="off"
            className="border border-gray-200 rounded-sm p-2 flex-grow focus-visible:outline-gray-200"
            name="phone"
            id="phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value.trim() })}
          />
        </div>
        <div className="flex gap-2 flex-col">
          <label
            className="w-16 inline-block text-gray-500 text-[14px]"
            htmlFor="password">
            密码
          </label>
          <input
            className="border border-gray-200 rounded-sm p-2 flex-grow focus-visible:outline-gray-200"
            type={showRawPassword ? "text" : "password"}
            name="password"
            id="password"
            value={form.password}
            onChange={(e) => {
              e.stopPropagation()
              setForm({ ...form, password: e.target.value.trim() })
            }}
          />
          <span
            className="relative bottom-[32px] left-[210px] cursor-pointer opacity-50"
            onClick={() => setShowRawPassword(!showRawPassword)}>
            {showRawPassword ? <BsEye /> : <BsEyeSlash />}
          </span>
        </div>
        <button
          className="rounded-sm text-[14px] bg-[#cb5647] text-white relative overflow-hidden"
          type="submit">
          <div
            className="relative transition-all"
            style={{ top: isLoading ? "50%" : "-50%" }}>
            <div className="flex items-center gap-2 justify-center relative bottom-2">
              <AiOutlineLoading3Quarters className="animate-spin" />
              <span>登录中...</span>
            </div>
            <span className="top-2 relative">登录</span>
          </div>
        </button>
        <div
          className="text-red-500 text-[12px] h-4 text-center"
          style={{ opacity: error.length }}>
          {error}
        </div>
      </div>
      <a
        href={HOMEPAGE}
        target="_blank"
        className="opacity-30 hover:opacity-80 transition-all absolute left-2 bottom-2 text-[12px] z-20">
        忘记密码 / 注册用户
      </a>
      <img className="absolute top-0 bottom-0 right-0 h-[100%]" src={authSvg} />
    </form>
  )
}
