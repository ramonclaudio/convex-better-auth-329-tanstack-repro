import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { nitro } from "nitro/vite"
import { defineConfig, loadEnv } from "vite"

function getConvexSiteUrl(deployment: string | undefined) {
  if (!deployment) return undefined
  const projectName = deployment.split(":")[1]
  return `https://${projectName}.convex.site`
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const convexUrl = env.VITE_CONVEX_URL
  const convexSiteUrl = env.VITE_CONVEX_SITE_URL || getConvexSiteUrl(env.CONVEX_DEPLOYMENT)
  const siteUrl = env.SITE_URL || "http://localhost:3000"

  return {
    server: { port: 3000 },
    resolve: { tsconfigPaths: true },
    ssr: {
      noExternal: ["@convex-dev/better-auth"],
    },
    define: {
      "process.env.VITE_CONVEX_URL": JSON.stringify(convexUrl),
      "process.env.VITE_CONVEX_SITE_URL": JSON.stringify(convexSiteUrl),
      "process.env.CONVEX_SITE_URL": JSON.stringify(convexSiteUrl),
      "process.env.SITE_URL": JSON.stringify(siteUrl),
    },
    plugins: [
      tanstackStart({ srcDirectory: "src" }),
      viteReact(),
      nitro(),
    ],
  }
})
