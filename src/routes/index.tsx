import { useConvexAuth, useQuery } from "convex/react"
import { createFileRoute } from "@tanstack/react-router"
import { useCallback, useEffect, useRef, useState } from "react"

import { api } from "../../convex/_generated/api"
import { authClient } from "@/lib/auth-client"

export const Route = createFileRoute("/")({ component: Repro })

type LogLine = { t: number; kind: "info" | "ok" | "err"; text: string }

const PASSWORD_A = "passwordOriginalA1"
const PASSWORD_B = "passwordRotatedB2"

function Repro() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const session = authClient.useSession()
  const me = useQuery(api.functions.me, isAuthenticated ? {} : "skip")

  const [log, setLog] = useState<LogLine[]>([])
  const [password, setPassword] = useState(PASSWORD_A)
  const [rotating, setRotating] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const bootstrapped = useRef(false)

  const append = useCallback((kind: LogLine["kind"], text: string) => {
    setLog((prev) => [{ t: Date.now(), kind, text }, ...prev].slice(0, 50))
  }, [])

  useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true
    void (async () => {
      const fresh = `alice+${Date.now()}@test.com`
      setEmail(fresh)
      append("info", `signing up ${fresh}…`)
      const su = await authClient.signUp.email({
        email: fresh,
        password: PASSWORD_A,
        name: "Alice",
      })
      if (su.error) {
        append("err", `sign-up failed: ${su.error.message}`)
        return
      }
      append("ok", "signed up + auto-signed-in")
    })()
  }, [append])

  const rotate = useCallback(async () => {
    setRotating(true)
    const from = password
    const to = from === PASSWORD_A ? PASSWORD_B : PASSWORD_A
    append("info", "change-password (revokeOtherSessions: true)…")
    const r = await authClient.changePassword({
      currentPassword: from,
      newPassword: to,
      revokeOtherSessions: true,
    })
    if (r.error) {
      append("err", `change-password failed: ${r.error.message}`)
    } else {
      append("ok", "change-password ok, session rotated server-side")
      setPassword(to)
    }
    setRotating(false)
  }, [password, append])

  const lastMeRef = useRef<string>("")
  useEffect(() => {
    const snapshot =
      me === undefined
        ? "loading"
        : me === null
          ? "null"
          : me.authed
            ? `authed:${me.email ?? ""}`
            : "unauthed"
    if (snapshot !== lastMeRef.current) {
      lastMeRef.current = snapshot
      if (me === undefined) {
        append("info", "Convex query: loading")
      } else if (me?.authed) {
        append("ok", `Convex query: authed as ${me.email}`)
      } else if (me && !me.authed) {
        append("err", "Convex query: UNAUTHED (stale JWT)")
      }
    }
  }, [me, append])

  const sessionId = session.data?.session.id ?? null

  return (
    <>
      <h1>convex-better-auth #329 repro</h1>
      <p>
        change-password rotates the BA session id; the Convex provider's
        cached JWT stays bound to the deleted session for ~500-1500 ms.
      </p>

      <div className="card">
        <Row label="useConvexAuth.isAuthenticated" value={String(isAuthenticated)} />
        <Row label="useConvexAuth.isLoading" value={String(isLoading)} />
        <Row label="useSession sessionId" value={sessionId ?? "—"} />
        <Row
          label="api.functions.me"
          value={
            me === undefined
              ? "loading…"
              : me === null
                ? "null"
                : me.authed
                  ? `✓ authed as ${me.email}`
                  : "✗ UNAUTHED (stale JWT)"
          }
          tone={me && !me.authed ? "bad" : me?.authed ? "good" : undefined}
        />
        <Row label="test email" value={email ?? "—"} />
      </div>

      <div className="card">
        <button onClick={rotate} disabled={!isAuthenticated || rotating}>
          {rotating ? "rotating…" : "Trigger session rotation"}
        </button>
      </div>

      <div className="card">
        <div className="log">
          {log.length === 0 ? (
            <div className="line">waiting…</div>
          ) : (
            log.map((line, i) => (
              <div key={`${line.t}-${i}`} className={`line ${line.kind === "ok" ? "ok" : line.kind === "err" ? "err" : ""}`}>
                {new Date(line.t).toLocaleTimeString()} · {line.text}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  return (
    <div className={`row ${tone === "bad" ? "bad" : tone === "good" ? "good" : ""}`}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  )
}
