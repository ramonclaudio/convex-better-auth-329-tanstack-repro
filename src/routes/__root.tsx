import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react"
import type { ConvexQueryClient } from "@convex-dev/react-query"
import type { QueryClient } from "@tanstack/react-query"
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
  useRouteContext,
} from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"

import { authClient } from "@/lib/auth-client"
import { getToken } from "@/lib/auth-server"
import appCss from "../styles.css?url"

const getAuth = createServerFn({ method: "GET" }).handler(async () => {
  return await getToken()
})

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
  convexQueryClient: ConvexQueryClient
}>()({
  beforeLoad: async (ctx) => {
    const token = await getAuth()
    if (token) {
      ctx.context.convexQueryClient.serverHttpClient?.setAuth(token)
    }
    return { token }
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "convex-better-auth #329 repro" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootComponent,
})

function RootComponent() {
  const context = useRouteContext({ from: Route.id })
  return (
    <ConvexBetterAuthProvider
      client={context.convexQueryClient.convexClient}
      authClient={authClient}
      initialToken={context.token}
    >
      <RootDocument>
        <Outlet />
      </RootDocument>
    </ConvexBetterAuthProvider>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <main>{children}</main>
        <Scripts />
      </body>
    </html>
  )
}
