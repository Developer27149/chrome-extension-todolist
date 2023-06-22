import styleText from "data-text:../style.css"
import hotkeys from "hotkeys-js"
import { useAtom } from "jotai"
import jwtDecode from "jwt-decode"
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
import { useEffect, useRef, useState } from "react"

import Auth from "~components/Auth"
import MainContainer from "~components/MainContainer"
import { userInfoAtom } from "~utils/store"

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style")
  style.textContent = styleText
  return style
}

const CustomButton = () => {
  const isReady = useRef<boolean>(false)

  const [active, setActive] = useState<boolean>(!false)

  const [hadAuth, setHadAuth] = useState<undefined | boolean>()
  const [, setUserInfo] = useAtom(userInfoAtom)
  useEffect(() => {
    hotkeys("ctrl+j,command+.,win+.", function (event) {
      event.preventDefault()
      if (isReady.current) return
      isReady.current = true
      setActive(true)
    })
    hotkeys("escape", function (event) {
      event.preventDefault()
      if (isReady.current === false) return
      isReady.current = false
      setActive(false)
    })
    document.querySelector("#_extension_container_")?.addEventListener(
      "keydown",
      function (event) {
        event.stopImmediatePropagation()
        event.stopPropagation()
        event.preventDefault()
      },
      true
    )
  }, [])

  useEffect(() => {
    // init and get token
    chrome.storage.sync.get(["token", "loginUserData"], async (result) => {
      try {
        const { token, loginUserData } = result
        console.log("userInfo", loginUserData)
        if (token && loginUserData) {
          const record = jwtDecode(token) as { exp: number }
          // check if token is expired
          const isNotExpired = record.exp * 1000 > Date.now()
          if (isNotExpired) {
            setHadAuth(true)
            setUserInfo(loginUserData)
          } else {
            // show login component
            setHadAuth(false)
          }
        } else {
          setHadAuth(false)
        }
      } catch (error) {
        console.log("error", error)
        setActive(false)
      }
    })
    // 每次启用，都禁止页面body滚动
    document.body.style.overflow = active === true ? "hidden" : "unset"
  }, [active])

  if (active === false || hadAuth === undefined) return null

  return (
    <div
      id="_extension_container_"
      className="fixed inset-0 flex justify-center items-center w-screen h-screen bg-[#33333380]"
      onClick={() => setActive(false)}>
      {hadAuth ? (
        <MainContainer
          onDisReady={() => setHadAuth(false)}
          onDisActive={() => {
            isReady.current = false
            setActive(false)
          }}
        />
      ) : (
        <Auth setAuth={() => setHadAuth(true)} />
      )}
    </div>
  )
}

export default CustomButton

export const config: PlasmoCSConfig = {
  css: ["font.css"]
}
