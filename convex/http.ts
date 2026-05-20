import { httpRouter } from "convex/server"

import { authComponent, createAuth } from "./auth"

const http = httpRouter()

// TanStack Start proxies /api/auth/* to the Convex deployment via auth-server,
// so browser→Convex auth traffic is same-origin. No CORS or trustedOrigins
// needed here.
authComponent.registerRoutesLazy(http, createAuth)

export default http
