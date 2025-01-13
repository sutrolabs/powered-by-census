import humanizeDuration from "humanize-duration"
import { useMemo } from "react"

import { Tag } from "@components/Tag"

const loadingMode = {
  className: "bg-slate-100 text-slate-300",
  text: "Loading...",
}

const notConnectedMode = {
  className: "bg-slate-200 text-slate-400",
  text: "Not connected",
}

const unknownMode = {
  className: "bg-slate-200 text-slate-900",
  text: "Unknown",
}

const modes = [
  {
    status: "running",
    className: "bg-orange-500 text-orange-50",
    text: "Running...",
  },
  {
    status: "pending",
    className: "bg-slate-300 text-slate-50",
    text: "Not run yet",
  },
  {
    status: "done",
    className: "bg-orange-200 text-orange-700",
    text: "Up to date",
  },
]

export function SyncStatus({ className, syncsLoading, syncs, runsLoading, runs, showAge }) {
  const [mode, age] = useMemo(() => {
    if (syncsLoading || runsLoading) {
      return [loadingMode, undefined]
    }

    const activeSyncs = syncs.filter((item) => !item.paused)
    if (!activeSyncs.length) {
      return [notConnectedMode, undefined]
    }

    let index = undefined
    let mode = undefined
    let completedAt = undefined
    for (const sync of activeSyncs) {
      const run = runs.find((item) => item.sync_id === sync.id)
      const status = !run ? "pending" : run.completed_at ? "done" : "running"
      const newIndex = modes.findIndex((mode) => mode.status === status)
      const newCompletedAt = run?.completed_at
      if (
        newIndex >= 0 &&
        (index === undefined || newIndex < index || (newIndex === index && newCompletedAt < completedAt))
      ) {
        index = newIndex
        mode = modes[newIndex]
        completedAt = newCompletedAt
      }
    }
    return [mode ?? unknownMode, completedAt ? Date.now() - new Date(completedAt).getTime() : undefined]
  }, [syncsLoading, syncs, runsLoading, runs])
  return (
    <Tag
      className={`${mode.className} ${className}`}
      text={`${mode.text}${
        showAge && age ? ` (${humanizeDuration(age, { units: ["h", "m"], round: true })} ago)` : ""
      }`}
    />
  )
}
