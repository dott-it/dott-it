"use client"

import { env } from "@/app/env/client.mjs"
import Intercom, { shutdown } from "@intercom/messenger-js-sdk"
import type { InitType } from "@intercom/messenger-js-sdk/dist/types"
import { useSession } from "next-auth/react"
import { JSX, useEffect } from "react"

interface IntercomUser {
  id?: string
  name?: string | null
  email?: string | null
  createdAt?: string | number | Date
}

function toUnixTimestamp(createdAt?: IntercomUser["createdAt"]): number | undefined {
  if (!createdAt) return undefined

  if (createdAt instanceof Date) {
    return Math.floor(createdAt.getTime() / 1000)
  }

  if (typeof createdAt === "number") {
    return createdAt > 1e12 ? Math.floor(createdAt / 1000) : createdAt
  }

  const parsedDate = Date.parse(createdAt)

  if (Number.isNaN(parsedDate)) {
    return undefined
  }

  return Math.floor(parsedDate / 1000)
}

export function IntercomMessenger(): JSX.Element | null {
  const { data: session } = useSession()
  const user = session?.user as IntercomUser | undefined

  useEffect(() => {
    if (!env.NEXT_PUBLIC_INTERCOM_APP_ID) return

    const intercomConfig: InitType = {
      app_id: env.NEXT_PUBLIC_INTERCOM_APP_ID,
    }

    if (user?.id) intercomConfig.user_id = user.id
    if (user?.name) intercomConfig.name = user.name
    if (user?.email) intercomConfig.email = user.email

    const createdAt = toUnixTimestamp(user?.createdAt)
    if (createdAt) intercomConfig.created_at = createdAt

    Intercom(intercomConfig)

    return () => {
      shutdown()
    }
  }, [user?.createdAt, user?.email, user?.id, user?.name])

  return null
}
