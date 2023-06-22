import clsx from "clsx"
import { type ChangeEvent, memo, useEffect, useState } from "react"

const Avatar = memo(function AvatarComponent({ name }: { name: string }) {
  const [avatarSrc, setAvatarSrc] = useState<string>("")
  const [isError, setIsError] = useState(true)

  useEffect(() => {
    chrome.storage.local.get("avatarBase64").then((data) => {
      if (data.avatarBase64) {
        setIsError(false)
        setAvatarSrc(data.avatarBase64 as unknown as string)
      }
    })
  }, [])

  const onUploadImg = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files[0]
    const reader = new FileReader()
    reader.onload = function () {
      const avatarBase64 = reader.result as string
      setAvatarSrc(avatarBase64)
      setIsError(false)
      chrome.storage.local.set({ avatarBase64 })
    }
    reader.readAsDataURL(file)
  }

  return (
    <>
      <div className="rounded-full w-16 h-16 mb-2 bg-white flex justify-center items-center relative cursor-pointer">
        {avatarSrc !== "" && !isError ? (
          <img
            src={avatarSrc}
            onError={() => setIsError(true)}
            onLoad={() => setIsError(false)}
            className={clsx(
              { "opacity-0": isError },
              "w-full h-full rounded-full"
            )}
          />
        ) : (
          <span className="text-[#db4c3f] text-2xl font-bold">
            {name.at(0)?.toUpperCase()}
          </span>
        )}
        <input
          accept="image/*"
          type="file"
          max={1}
          className="absolute inset-0 opacity-0"
          onChange={onUploadImg}
        />
      </div>
    </>
  )
})

export default Avatar
