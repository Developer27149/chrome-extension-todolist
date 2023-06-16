import jwtDecode from "jwt-decode"

import { calcExprTimeByIndex, getFavicon, saveFavicon } from "~utils"
import { createNewTodoItem } from "~utils/services"
import type { ITaskType } from "~utils/types"

;(async () => {
  const token = await chrome.storage.sync.get("token")
  if (token.token) {
    // use jwt token to get user info
    const record = jwtDecode<{ exp: number }>(token.token)
    const { exp } = record
    if (exp * 1000 > Date.now()) {
      // token expired
      chrome.storage.local.get("taskTypeList").then((res) => {
        const taskTypeList = res.taskTypeList as ITaskType[]
        if (!Array.isArray(taskTypeList)) return
        chrome.contextMenus.create({
          title: "DoDD - 留存当前页到",
          id: "id"
        })
        taskTypeList.forEach((item: ITaskType) => {
          chrome.contextMenus.create({
            title: item.typeName,
            id: `${item.typeId}`,
            parentId: "id"
          })
          ;["1 天内", "3 天内", "7 天内"].forEach((title, idx) => {
            chrome.contextMenus.create({
              title,
              id: `${item.typeId}-${idx}`,
              parentId: `${item.typeId}`
            })
          })
        })
        chrome.contextMenus.onClicked.addListener(async (info, tab) => {
          const { favIconUrl, title, url, id } = tab
          chrome.scripting.executeScript(
            {
              target: {
                tabId: id // the tab you want to inject into
              },
              world: "MAIN", // MAIN to access the window object
              func: () => {
                // get meta description
                const metaDescription = document.querySelector(
                  'meta[name="description"]'
                )
                return metaDescription.getAttribute("content")
              } // function to inject
            },
            async (res) => {
              try {
                const { result } = res[0]
                // save favIconUrl to localStorage
                const origin = new URL(url).origin
                let cache = await getFavicon(origin)
                if (!cache) {
                  // fetch favicon base64
                  const res = await fetch(favIconUrl)
                  const blob = await res.blob()
                  const base64 = await new Promise((resolve) => {
                    const reader = new FileReader()
                    reader.readAsDataURL(blob)
                    reader.onloadend = () => {
                      resolve(reader.result)
                    }
                  })
                  saveFavicon(origin, base64 as string)
                  cache = base64 as string
                }

                const [menuId, idx] = (info.menuItemId as string).split("-")
                const taskType = taskTypeList.find(
                  (item: ITaskType) => `${item.typeId}` === menuId
                )
                if (!taskType) return
                const body = {
                  taskContent: result ?? "",
                  taskName: `[${title}](${url})`,
                  typeId: +menuId,
                  expectTime: calcExprTimeByIndex(+idx)
                }
                createNewTodoItem(body)
              } catch (error) {
                console.log("get favicon fail:", error)
              }
            }
          )
        })
      })
    }
  }
})()
