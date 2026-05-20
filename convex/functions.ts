import { v } from "convex/values"

import { query } from "./_generated/server"
import { authComponent } from "./auth"

// The query that exposes the bug. Convex's WebSocket holds whatever auth
// token the React provider hands it. If the provider hands back a stale JWT
// after a session rotation, this query returns `authed: false` with the
// session's deleted-id symptom even though the user is logged in elsewhere.
export const me = query({
  args: {},
  returns: v.object({
    email: v.union(v.string(), v.null()),
    authed: v.boolean(),
    now: v.number(),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return { email: null, authed: false, now: Date.now() }
    }
    try {
      const user = await authComponent.getAuthUser(ctx)
      return {
        email: user?.email ?? identity.email ?? null,
        authed: true,
        now: Date.now(),
      }
    } catch {
      // getAuthUser throws when the JWT's session id doesn't resolve in the
      // BA component. That's exactly the stale-JWT-after-rotation case.
      return { email: null, authed: false, now: Date.now() }
    }
  },
})
