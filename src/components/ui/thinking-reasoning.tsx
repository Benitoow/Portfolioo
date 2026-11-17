"use client"

import { useEffect, useRef, useState } from "react"

export type ThoughtScript = {
  verb?: string
  doneVerb?: string
  directOnly?: boolean
  thoughts?: string[]
  answer: string
}

const styles = {
  tr: "trr-root",
  trHeader: "trr-header",
  isClickable: "trr-clickable",
  trLabel: "trr-label",
  trVerb: "trr-verb",
  trChevron: "trr-chevron",
  trShimmer: "trr-shimmer",
  trCollapsible: "trr-collapsible",
  isCollapsed: "trr-collapsed",
  trInner: "trr-inner",
  trViewport: "trr-viewport",
  isScroll: "trr-scroll",
  trStream: "trr-stream",
  trSentence: "trr-sentence",
} as const

export const DEFAULT_SENTENCES = [
  "Lecture de la double approche de Benjamin : rigueur du code et sens visuel.",
  "Tout le site tourne avec une architecture statique optimisée et WebGL maison.",
  "Synthèse en une phrase simple et naturelle.",
]

const DELAYS = [320, 620, 620, 620]
const COLLAPSE_BEAT = 320
const SENT_H = 38
const GAP = 5
const MAX_H = 132
const FADE = 14

export type ThinkingReasoningProps = {
  verb?: string
  doneVerb?: string
  sentences?: string[]
  answer?: string
  directOnly?: boolean
  onStep?: () => void
  onDone?: () => void
  onInteract?: () => void
}

export function ThinkingReasoning({
  verb = "Réflexion…",
  doneVerb = "Pensé",
  sentences = DEFAULT_SENTENCES,
  answer,
  directOnly = false,
  onStep,
  onDone,
  onInteract,
}: ThinkingReasoningProps) {
  const [phase, setPhase] = useState<"thinking" | "done">(
    directOnly ? "done" : "thinking"
  )
  const [revealed, setRevealed] = useState(directOnly ? sentences.length : 0)
  const [open, setOpen] = useState(false)
  const [fade, setFade] = useState({ top: false, bottom: true })
  const viewportRef = useRef<HTMLDivElement>(null)

  const totalMs = sentences.reduce((acc, _, i) => acc + (DELAYS[i] ?? 620), 0)
  const elapsedS = Math.max(1, Math.round(totalMs / 1000))

  useEffect(() => {
    if (
      directOnly ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      setRevealed(sentences.length)
      setPhase("done")
      onDone?.()
      return
    }
    setPhase("thinking")
    setRevealed(0)
    setOpen(false)

    const timers: ReturnType<typeof setTimeout>[] = []
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms))
    let t = 0
    sentences.forEach((_, i) => {
      t += DELAYS[i] ?? 620
      at(t, () => {
        setRevealed(i + 1)
        onStep?.()
      })
    })
    at(totalMs + COLLAPSE_BEAT, () => {
      setPhase("done")
      onDone?.()
    })
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentences, directOnly])

  const done = phase === "done"
  const expanded = done ? open : true
  const count = done ? sentences.length : revealed
  const contentH = count > 0 ? count * SENT_H + (count - 1) * GAP : 0
  const capped = contentH > MAX_H
  const viewH = capped ? MAX_H : contentH
  const scrollable = done && open
  const translate = scrollable ? 0 : capped ? MAX_H - FADE - contentH : 0

  const showTop = scrollable ? fade.top : capped
  const showBottom = scrollable ? fade.bottom : capped
  const mask = capped
    ? `linear-gradient(to bottom, transparent 0, #000 ${showTop ? FADE : 0}px, #000 calc(100% - ${showBottom ? FADE : 0}px), transparent 100%)`
    : "none"

  const onScroll = () => {
    const el = viewportRef.current
    if (!el) return
    setFade({
      top: el.scrollTop > 1,
      bottom: el.scrollTop + el.clientHeight < el.scrollHeight - 1,
    })
  }

  const toggle = () => {
    onInteract?.()
    const next = !open
    if (next) {
      setFade({ top: false, bottom: true })
      if (viewportRef.current) viewportRef.current.scrollTop = 0
    }
    setOpen(next)
  }

  return (
    <div className={styles.tr}>
      {!directOnly && (
        <button
          type="button"
          className={styles.trHeader + (done ? " " + styles.isClickable : "")}
          aria-expanded={expanded}
          aria-label="Afficher ou masquer la réflexion"
          onClick={done ? toggle : undefined}
          onPointerEnter={onInteract}
        >
          {done ? (
            <span className={styles.trLabel}>
              <span className={styles.trVerb}>{doneVerb}</span> · {elapsedS}s
            </span>
          ) : (
            <span className={styles.trLabel + " " + styles.trShimmer}>
              {verb}
            </span>
          )}
          {done && (
            <svg
              className={styles.trChevron}
              viewBox="0 0 24 24"
              width="12"
              height="12"
              aria-hidden="true"
            >
              <path
                d="m4.5 15.75 7.5-7.5 7.5 7.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      )}

      {!directOnly && (
        <div
          className={
            styles.trCollapsible + (expanded ? "" : " " + styles.isCollapsed)
          }
        >
          <div className={styles.trInner}>
            <div
              ref={viewportRef}
              className={
                styles.trViewport + (scrollable ? " " + styles.isScroll : "")
              }
              style={{
                height: `${viewH}px`,
                WebkitMaskImage: mask,
                maskImage: mask,
              }}
              onScroll={scrollable ? onScroll : undefined}
            >
              <div
                className={styles.trStream}
                style={{ transform: `translateY(${translate}px)` }}
              >
                {sentences.slice(0, count).map((line, i) => (
                  <p key={i} className={styles.trSentence}>
                    <span className="trr-text-bg">{line}</span>
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {done && answer ? (
        <div
          className={
            "orb-answer" + (directOnly ? " orb-answer--direct" : "")
          }
        >
          <span className="trr-text-bg">{answer}</span>
        </div>
      ) : null}
    </div>
  )
}

export default ThinkingReasoning
