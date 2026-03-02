'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { ArrowLeft, CalendarDays, Clock, Image as ImageIcon, Loader2, Sparkles, Tag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn, formatCurrency, formatDateTime, getTradeTotalPnl } from '@/lib/utils'
import { getTradePlaybookIds } from '@/lib/playbooks'
import type { Playbook, Trade, TradeMistake } from '@/lib/db/schema'

type MistakeWithTrade = Pick<TradeMistake, 'id' | 'tradeId' | 'mistakeType' | 'description' | 'severity'>

function prettyMistakeType(value: string) {
  return value.replace(/_/g, ' ')
}

interface Props {
  dayLabel: string
  trades: Trade[]
  playbooks: Playbook[]
  mistakes: MistakeWithTrade[]
  accountLabel?: string | null
  startIso: string
  endIso: string
  accountId?: string | null
}

interface DaySummary {
  headline: string
  score: number
  summary: string
  strengths: string[]
  improvements: string[]
  oneAction: string
}

export function DayJournalClient({
  dayLabel, trades, playbooks, mistakes, accountLabel, startIso, endIso, accountId,
}: Props) {
  const [aiSummary, setAiSummary] = useState<DaySummary | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const playbookMap = new Map(playbooks.map(pb => [pb.id, pb] as const))
  const sortedTrades = [...trades].sort(
    (a, b) => new Date(b.exitTime).getTime() - new Date(a.exitTime).getTime()
  )

  const totalPnl = sortedTrades.reduce((sum, t) => sum + getTradeTotalPnl(t), 0)
  const wins = sortedTrades.filter(t => getTradeTotalPnl(t) > 0).length
  const losses = sortedTrades.filter(t => getTradeTotalPnl(t) < 0).length
  const winRate = sortedTrades.length ? Math.round((wins / sortedTrades.length) * 100) : 0
  const mistakeCount = mistakes.length

  async function summarizeDay() {
    setAiLoading(true)
    setAiError(null)
    try {
      const res = await fetch('/api/ai/day-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start: startIso,
          end: endIso,
          accountId: accountId ?? null,
          dayLabel,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAiError(data?.error ?? 'Failed to summarize this day')
        return
      }
      setAiSummary(data.summary ?? null)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to summarize this day'
      setAiError(message)
    } finally {
      setAiLoading(false)
    }
  }

  const mistakesByTradeId = new Map<string, MistakeWithTrade[]>()
  for (const mistake of mistakes) {
    const arr = mistakesByTradeId.get(mistake.tradeId) ?? []
    arr.push(mistake)
    mistakesByTradeId.set(mistake.tradeId, arr)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Day Review</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" />
              {dayLabel}
            </span>
            {accountLabel ? ` - ${accountLabel}` : ''}
          </p>
        </div>
        <Button asChild variant="outline" className="gap-2 w-fit">
          <Link href="/analytics">
            <ArrowLeft className="w-4 h-4" />
            Back to Analytics
          </Link>
        </Button>
        <Button
          onClick={summarizeDay}
          disabled={aiLoading || sortedTrades.length === 0}
          className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-black w-fit"
        >
          {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Summarize this day
        </Button>
      </div>

      {aiError && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-4 text-sm text-red-400">{aiError}</CardContent>
        </Card>
      )}

      {aiSummary && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base font-black">{aiSummary.headline}</CardTitle>
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-500">
                Score {aiSummary.score}/100
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{aiSummary.summary}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                <p className="text-[10px] uppercase tracking-wider text-emerald-500 mb-2">Strengths</p>
                <div className="space-y-1">
                  {aiSummary.strengths?.map((s, i) => <p key={i} className="text-xs">{s}</p>)}
                </div>
              </div>
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                <p className="text-[10px] uppercase tracking-wider text-amber-500 mb-2">Improvements</p>
                <div className="space-y-1">
                  {aiSummary.improvements?.map((s, i) => <p key={i} className="text-xs">{s}</p>)}
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-border/70 bg-card/70 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">One Action</p>
              <p className="text-sm font-semibold">{aiSummary.oneAction}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Trades</p><p className="text-xl font-black">{sortedTrades.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Net P&L</p><p className={cn('text-xl font-black tabular-nums', totalPnl >= 0 ? 'text-emerald-500' : 'text-red-500')}>{formatCurrency(totalPnl)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Win Rate</p><p className="text-xl font-black">{winRate}%</p><p className="text-[10px] text-muted-foreground">{wins}W / {losses}L</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Mistakes Logged</p><p className={cn('text-xl font-black', mistakeCount > 0 ? 'text-amber-500' : 'text-muted-foreground')}>{mistakeCount}</p></CardContent></Card>
      </div>

      {sortedTrades.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No trades found for this day.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedTrades.map(trade => {
            const pnl = getTradeTotalPnl(trade)
            const relatedMistakes = mistakesByTradeId.get(trade.id) ?? []
            const tradePlaybooks = getTradePlaybookIds(trade)
              .map(id => playbookMap.get(id))
              .filter(Boolean) as Playbook[]

            return (
              <Card key={trade.id} className="overflow-hidden border-border/70">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <CardTitle className="text-base font-black flex items-center gap-2">
                        <span>{trade.symbol}</span>
                        <Badge variant="outline" className="text-[10px] uppercase">{trade.side}</Badge>
                      </CardTitle>
                      <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDateTime(trade.entryTime)} to {formatDateTime(trade.exitTime)}
                      </p>
                    </div>
                    <p className={cn('text-base font-black tabular-nums', pnl >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                      {formatCurrency(pnl)}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs">
                    <div className="rounded-lg bg-muted/30 p-2"><p className="text-muted-foreground">Qty</p><p className="font-bold">{trade.qty}</p></div>
                    <div className="rounded-lg bg-muted/30 p-2"><p className="text-muted-foreground">Entry</p><p className="font-bold">{Number(trade.entryPrice).toFixed(2)}</p></div>
                    <div className="rounded-lg bg-muted/30 p-2"><p className="text-muted-foreground">Exit</p><p className="font-bold">{Number(trade.exitPrice).toFixed(2)}</p></div>
                    <div className="rounded-lg bg-muted/30 p-2"><p className="text-muted-foreground">Commission</p><p className="font-bold">${Number(trade.commission ?? 0).toFixed(2)}</p></div>
                    <div className="rounded-lg bg-muted/30 p-2"><p className="text-muted-foreground">Grade</p><p className="font-bold">{trade.grade ?? '-'}</p></div>
                    <div className="rounded-lg bg-muted/30 p-2"><p className="text-muted-foreground">Emotion</p><p className="font-bold capitalize">{trade.emotion ?? '-'}</p></div>
                  </div>

                  {(trade.tags?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {trade.tags!.map(tag => (
                        <Badge key={tag} variant="outline" className="text-[10px] inline-flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {tradePlaybooks.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {tradePlaybooks.map(pb => (
                        <Badge key={pb.id} variant="outline" className="text-[10px]">
                          {pb.emoji} {pb.name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {trade.notes && (
                    <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{trade.notes}</p>
                    </div>
                  )}

                  {trade.screenshot && (
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5" />
                        Screenshot
                      </p>
                      <a href={trade.screenshot} target="_blank" rel="noreferrer" className="block">
                        <Image
                          src={trade.screenshot}
                          alt={`Trade screenshot for ${trade.symbol}`}
                          width={1200}
                          height={700}
                          unoptimized
                          className="w-full max-h-[380px] object-contain rounded-lg border border-border/70 bg-black/10"
                        />
                      </a>
                    </div>
                  )}

                  {relatedMistakes.length > 0 && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
                      <p className="text-[10px] uppercase tracking-wider text-amber-500">Mistakes</p>
                      {relatedMistakes.map(m => (
                        <div key={m.id} className="text-xs">
                          <p className="font-semibold capitalize">{prettyMistakeType(m.mistakeType)}</p>
                          {m.description && <p className="text-muted-foreground">{m.description}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
