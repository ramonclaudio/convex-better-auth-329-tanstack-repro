import { createClient } from "@convex-dev/better-auth"
import type { AuthFunctions, GenericCtx } from "@convex-dev/better-auth"
import { convex } from "@convex-dev/better-auth/plugins"
import type { BetterAuthOptions } from "better-auth"
import { betterAuth } from "better-auth/minimal"

import { components, internal } from "./_generated/api"
import type { DataModel } from "./_generated/dataModel"
import authConfig from "./auth.config"

const authFunctions: AuthFunctions = internal.auth

export const authComponent = createClient<DataModel>(components.betterAuth, {
  authFunctions,
  triggers: {},
})

export const createAuth = (
  ctx: GenericCtx<DataModel>,
  { optionsOnly } = { optionsOnly: false },
) =>
  betterAuth({
    baseURL: process.env.SITE_URL,
    database: authComponent.adapter(ctx),
    emailAndPassword: { enabled: true },
    account: { accountLinking: { enabled: true } },
    logger: { disabled: optionsOnly },
    plugins: [convex({ authConfig })],
  } satisfies BetterAuthOptions)

export const { onCreate, onDelete } = authComponent.triggersApi()
