/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

// components/analytics/AnalyticsClient.tsx

import { useMemo, useState } from 'react'
import { useTheme } from 'next-themes'
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell, ScatterChart, Scatter, LineChart, Line, AreaChart, Area,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TradingCalendar } from './TradingCalendar'
import { calcStats, formatCurrency, formatDate, getTradeTotalPnl } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Trade } from '@/lib/db/schema'
import { consolidateTradesAsTrades } from '@/lib/consolidateTrades'
import { useJournalConsolidatePartials } from '@/lib/useJournalConsolidatePartials'

interface Props { trades: Trade[] }
type RangeKey = 'all' | '7d' | '30d' | '90d' | 'ytd'
type SessionName = 'Asia' | 'London' | 'New York'

const RANGE_LABELS: Record<RangeKey, string> = {
  all: 'All time',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  ytd: 'Year to date',
}

function getSessionByHour(hour: number): SessionName {
  if (hour >= 21 || hour < 7) return 'Asia'
  if (hour < 13) return 'London'
  return 'New York'
}

function ChartTooltip({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-xs">
      {label && <p className="text-muted-foreground mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-bold" style={{ color: p.color ?? p.fill }}>
          {formatter ? formatter(p.value, p.name) : `${p.name}: ${p.value}`}
        </p>
      ))}
    </div>
  )
}

export function AnalyticsClient({ trades }: Props) {
  const { consolidatePartials, updateConsolidatePartials } = useJournalConsolidatePartials()
  const { theme } = useTheme()
  const [range, setRange] = useState<RangeKey>('30d')
  const isDark = theme === 'dark'
  const gridColor = isDark ? '#1e293b' : '#f1f5f9'
  const axisColor = '#64748b'

  const consolidatedTrades = useMemo(() => {
    if (!consolidatePartials) return trades
    return consolidateTradesAsTrades(trades)
  }, [trades, consolidatePartials])

  const rangeStart = useMemo(() => {
    const now = new Date()
    if (range === 'all') return null
    if (range === 'ytd') return new Date(now.getFullYear(), 0, 1)
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
    const start = new Date(now)
    start.setDate(start.getDate() - days)
    return start
  }, [range])

  const displayTrades = useMemo(() => {
    if (!rangeStart) return consolidatedTrades
    return consolidatedTrades.filter(t => new Date(t.exitTime) >= rangeStart)
  }, [consolidatedTrades, rangeStart])

  const stats = useMemo(() => calcStats(displayTrades as any), [displayTrades])

  const equityCurve = useMemo(() => {
    const sorted = [...displayTrades].sort((a, b) => new Date(a.exitTime).getTime() - new Date(b.exitTime).getTime())
    let running = 0
    let peak = 0
    return sorted.map(t => {
      running += getTradeTotalPnl(t)
      peak = Math.max(peak, running)
      return {
        date: formatDate(t.exitTime),
        cumPnl: Number(running.toFixed(2)),
        drawdown: Number((peak - running).toFixed(2)),
      }
    })
  }, [displayTrades])

  const dailyPnl = useMemo(() => {
    const map: Record<string, number> = {}
    displayTrades.forEach(t => {
      const day = new Date(t.exitTime).toISOString().slice(0, 10)
      map[day] = (map[day] ?? 0) + getTradeTotalPnl(t)
    })
    let cum = 0
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, pnl]) => {
        cum += pnl
        return { dateLabel: formatDate(date), dayPnl: Number(pnl.toFixed(2)), cumPnl: Number(cum.toFixed(2)) }
      })
  }, [displayTrades])

  const consistency = useMemo(() => {
    const activeDays = dailyPnl.length
    const profitableDays = dailyPnl.filter(d => d.dayPnl > 0).length
    const score = activeDays ? Math.round((profitableDays / activeDays) * 100) : 0
    return { activeDays, profitableDays, score, avgDailyPnl: activeDays ? stats.netPnl / activeDays : 0 }
  }, [dailyPnl, stats.netPnl])

  const distribution = useMemo(() => {
    if (!displayTrades.length) return []
    const pnls = displayTrades.map(getTradeTotalPnl)
    const min = Math.floor(Math.min(...pnls) / 50) * 50
    const max = Math.ceil(Math.max(...pnls) / 50) * 50
    const buckets: Record<string, { label: string; count: number; isWin: boolean }> = {}
    for (let b = min; b <= max; b += 50) {
      buckets[b] = { label: b < 0 ? `$${b}` : `+$${b}`, count: 0, isWin: b >= 0 }
    }
    pnls.forEach(p => {
      const bucket = Math.floor(p / 50) * 50
      if (buckets[bucket]) buckets[bucket].count++
    })
    return Object.values(buckets)
  }, [displayTrades])

  const byDow = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const map: Record<number, { pnl: number; count: number }> = {}
    days.forEach((_, i) => { map[i] = { pnl: 0, count: 0 } })
    displayTrades.forEach(t => {
      const dow = new Date(t.exitTime).getDay()
      map[dow].pnl += getTradeTotalPnl(t)
      map[dow].count++
    })
    return days.map((name, i) => ({
      day: name.slice(0, 3), pnl: Number(map[i].pnl.toFixed(2)), trades: map[i].count,
    })).filter(d => d.trades > 0)
  }, [displayTrades])

  const byHour = useMemo(() => {
    const map: Record<number, { pnl: number; count: number }> = {}
    for (let h = 0; h < 24; h++) map[h] = { pnl: 0, count: 0 }
    displayTrades.forEach(t => {
      const h = new Date(t.exitTime).getHours()
      map[h].pnl += getTradeTotalPnl(t); map[h].count++
    })
    return Object.entries(map).filter(([, v]) => v.count > 0)
      .map(([hour, v]) => ({ hour: `${hour.padStart(2, '0')}:00`, pnl: Number(v.pnl.toFixed(2)), trades: v.count }))
  }, [displayTrades])

  const bySymbol = useMemo(() => {
    const map: Record<string, { pnl: number; count: number; wins: number }> = {}
    displayTrades.forEach(t => {
      if (!map[t.symbol]) map[t.symbol] = { pnl: 0, count: 0, wins: 0 }
      map[t.symbol].pnl += getTradeTotalPnl(t); map[t.symbol].count++
      if (getTradeTotalPnl(t) > 0) map[t.symbol].wins++
    })
    return Object.entries(map).map(([symbol, v]) => ({
      symbol, pnl: Number(v.pnl.toFixed(2)), trades: v.count,
      winRate: Math.round((v.wins / v.count) * 100),
    })).sort((a, b) => b.pnl - a.pnl)
  }, [displayTrades])

  const bySession = useMemo(() => {
    const sessions: Record<SessionName, { pnl: number; count: number; wins: number }> = {
      Asia: { pnl: 0, count: 0, wins: 0 },
      London: { pnl: 0, count: 0, wins: 0 },
      'New York': { pnl: 0, count: 0, wins: 0 },
    }

    displayTrades.forEach(t => {
      const entryHour = new Date(t.entryTime).getHours()
      const session = getSessionByHour(entryHour)
      const pnl = getTradeTotalPnl(t)
      sessions[session].pnl += pnl
      sessions[session].count++
      if (pnl > 0) sessions[session].wins++
    })

    return (Object.keys(sessions) as SessionName[]).map((session) => {
      const v = sessions[session]
      return {
        session,
        pnl: Number(v.pnl.toFixed(2)),
        trades: v.count,
        winRate: v.count ? Math.round((v.wins / v.count) * 100) : 0,
        expectancy: v.count ? Number((v.pnl / v.count).toFixed(2)) : 0,
      }
    })
  }, [displayTrades])

  const byEmotion = useMemo(() => {
    const map: Record<string, { pnl: number; count: number; wins: number }> = {}
    displayTrades.forEach(t => {
      const key = t.emotion ?? 'untracked'
      if (!map[key]) map[key] = { pnl: 0, count: 0, wins: 0 }
      const pnl = getTradeTotalPnl(t)
      map[key].pnl += pnl
      map[key].count++
      if (pnl > 0) map[key].wins++
    })
    return Object.entries(map).map(([emotion, v]) => ({
      emotion, pnl: Number(v.pnl.toFixed(2)), trades: v.count,
      winRate: Math.round((v.wins / v.count) * 100),
      expectancy: Number((v.pnl / v.count).toFixed(2)),
    })).sort((a, b) => b.pnl - a.pnl)
  }, [displayTrades])

  const byGrade = useMemo(() => {
    const map: Record<string, { pnl: number; count: number; wins: number }> = {}
    displayTrades.forEach(t => {
      const key = t.grade ?? 'ungraded'
      if (!map[key]) map[key] = { pnl: 0, count: 0, wins: 0 }
      const pnl = getTradeTotalPnl(t)
      map[key].pnl += pnl
      map[key].count++
      if (pnl > 0) map[key].wins++
    })
    return Object.entries(map).map(([grade, v]) => ({
      grade, pnl: Number(v.pnl.toFixed(2)), trades: v.count,
      winRate: Math.round((v.wins / v.count) * 100),
      expectancy: Number((v.pnl / v.count).toFixed(2)),
    })).sort((a, b) => b.pnl - a.pnl)
  }, [displayTrades])

  const streaks = useMemo(() => {
    const sorted = [...displayTrades].sort((a, b) => new Date(a.exitTime).getTime() - new Date(b.exitTime).getTime())
    let maxWin = 0, maxLoss = 0, curWin = 0, curLoss = 0
    sorted.forEach(t => {
      if (getTradeTotalPnl(t) > 0) { curWin++; curLoss = 0; maxWin = Math.max(maxWin, curWin) }
      else if (getTradeTotalPnl(t) < 0) { curLoss++; curWin = 0; maxLoss = Math.max(maxLoss, curLoss) }
    })
    return { maxWin, maxLoss }
  }, [displayTrades])

  const scatter = useMemo(() =>
    displayTrades.map(t => ({
      hour: new Date(t.entryTime).getHours() + new Date(t.entryTime).getMinutes() / 60,
      pnl: getTradeTotalPnl(t),
      symbol: t.symbol,
    })), [displayTrades])

  if (!displayTrades.length) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        No trades in this range. Try another range or import more trades.
      </div>
    )
  }

  return (
    <Tabs defaultValue="overview">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="diary">Trading Diary</TabsTrigger>
          <TabsTrigger value="timing">Timing</TabsTrigger>
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
          <TabsTrigger value="symbols">Symbols</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-3">
          <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
            <SelectTrigger className="h-9 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="ytd">Year to date</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 rounded-lg border border-border px-3 h-9">
            <Switch checked={consolidatePartials} onCheckedChange={updateConsolidatePartials} />
            <span className="text-xs font-semibold">Consolidate partials</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {displayTrades.length} / {consolidatedTrades.length} trades
          </span>
        </div>
      </div>

      {/* ══════════════ DIARY TAB ══════════════ */}
      <TabsContent value="diary" className="space-y-4">
        <TradingCalendar trades={displayTrades} />
      </TabsContent>

      {/* ══════════════ OVERVIEW TAB ══════════════ */}
      <TabsContent value="overview" className="space-y-6">
        <Card className="overflow-hidden border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-cyan-500/5 to-transparent">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Performance snapshot · {RANGE_LABELS[range]}
                </p>
                <p className={cn('text-3xl font-black tabular-nums mt-1', stats.netPnl >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                  {formatCurrency(stats.netPnl)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <p className="text-muted-foreground">Profit factor</p>
                <p className="font-bold tabular-nums text-right">{Number.isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(2) : 'Inf'}</p>
                <p className="text-muted-foreground">Max drawdown</p>
                <p className="font-bold tabular-nums text-right text-red-500">{formatCurrency(-stats.maxDrawdown)}</p>
                <p className="text-muted-foreground">Avg daily P&L</p>
                <p className={cn('font-bold tabular-nums text-right', consistency.avgDailyPnl >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                  {formatCurrency(consistency.avgDailyPnl)}
                </p>
                <p className="text-muted-foreground">Consistency score</p>
                <p className={cn(
                  'font-bold tabular-nums text-right',
                  consistency.score >= 70 ? 'text-emerald-500' : consistency.score >= 50 ? 'text-amber-500' : 'text-red-500'
                )}>
                  {consistency.score}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Avg Win',     value: `+$${stats.avgWin.toFixed(2)}`,    color: 'text-emerald-500' },
            { label: 'Avg Loss',    value: `-$${stats.avgLoss.toFixed(2)}`,   color: 'text-red-500' },
            { label: 'Expectancy',  value: `$${stats.expectancy.toFixed(2)}`, color: stats.expectancy >= 0 ? 'text-emerald-500' : 'text-red-500' },
            { label: 'Risk:Reward', value: `1 : ${(stats.avgWin / (stats.avgLoss || 1)).toFixed(2)}`, color: 'text-blue-500' },
            { label: 'Best Trade',  value: `+$${stats.bestTrade.toFixed(2)}`, color: 'text-emerald-500' },
            { label: 'Worst Trade', value: `$${stats.worstTrade.toFixed(2)}`, color: 'text-red-500' },
            { label: 'Win Streak',  value: `${streaks.maxWin} trades`,        color: 'text-emerald-500' },
            { label: 'Loss Streak', value: `${streaks.maxLoss} trades`,       color: 'text-red-500' },
          ].map(m => (
            <Card key={m.label}>
              <CardContent className="p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{m.label}</p>
                <p className={cn('text-xl font-black tabular-nums', m.color)}>{m.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Equity Curve</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={equityCurve} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: axisColor }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: axisColor }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} width={52} />
                  <Tooltip content={<ChartTooltip formatter={(v: number) => formatCurrency(v)} />} />
                  <ReferenceLine y={0} stroke={axisColor} strokeDasharray="3 3" strokeOpacity={0.4} />
                  <Line type="monotone" dataKey="cumPnl" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Drawdown Curve</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={equityCurve} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: axisColor }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: axisColor }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} width={52} />
                  <Tooltip content={<ChartTooltip formatter={(v: number) => `${formatCurrency(-v)} from peak`} />} />
                  <Area type="monotone" dataKey="drawdown" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Daily P&L</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyPnl} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 10, fill: axisColor }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: axisColor }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} width={52} />
                <Tooltip content={<ChartTooltip formatter={(v: number) => formatCurrency(v)} />} />
                <ReferenceLine y={0} stroke={axisColor} strokeDasharray="3 3" strokeOpacity={0.4} />
                <Bar dataKey="dayPnl" radius={[3, 3, 0, 0]} maxBarSize={32}>
                  {dailyPnl.map((e, i) => <Cell key={i} fill={e.dayPnl >= 0 ? '#10b981' : '#ef4444'} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">P&L Distribution</CardTitle>
              <span className="text-xs text-muted-foreground">per $50 bucket</span>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={distribution} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: axisColor }} tickLine={false} axisLine={false} interval={2} />
                <YAxis tick={{ fontSize: 10, fill: axisColor }} tickLine={false} axisLine={false} width={28} />
                <Tooltip content={<ChartTooltip formatter={(v: number) => `${v} trades`} />} />
                <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={20}>
                  {distribution.map((e, i) => <Cell key={i} fill={e.isWin ? '#10b981' : '#ef4444'} fillOpacity={0.8} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ══════════════ TIMING TAB ══════════════ */}
      <TabsContent value="timing" className="space-y-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">P&L by Day of Week</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byDow} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: axisColor }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: axisColor }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} width={52} />
                <Tooltip content={<ChartTooltip formatter={(v: number) => formatCurrency(v)} />} />
                <ReferenceLine y={0} stroke={axisColor} strokeDasharray="3 3" strokeOpacity={0.4} />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]} maxBarSize={48}>
                  {byDow.map((e, i) => <Cell key={i} fill={e.pnl >= 0 ? '#10b981' : '#ef4444'} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {byDow.length > 0 && (() => {
              const best = byDow.reduce((a, b) => a.pnl > b.pnl ? a : b)
              const worst = byDow.reduce((a, b) => a.pnl < b.pnl ? a : b)
              return (
                <div className="flex gap-3 mt-4">
                  <div className="flex-1 bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Best Day</p>
                    <p className="text-sm font-black text-emerald-500">{best.day}</p>
                    <p className="text-xs text-emerald-500">{formatCurrency(best.pnl)}</p>
                  </div>
                  <div className="flex-1 bg-red-500/5 border border-red-500/20 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Worst Day</p>
                    <p className="text-sm font-black text-red-500">{worst.day}</p>
                    <p className="text-xs text-red-500">{formatCurrency(worst.pnl)}</p>
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">P&L by Hour of Day</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byHour} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: axisColor }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: axisColor }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} width={52} />
                <Tooltip content={<ChartTooltip formatter={(v: number) => formatCurrency(v)} />} />
                <ReferenceLine y={0} stroke={axisColor} strokeDasharray="3 3" strokeOpacity={0.4} />
                <Bar dataKey="pnl" radius={[3, 3, 0, 0]} maxBarSize={28}>
                  {byHour.map((e, i) => <Cell key={i} fill={e.pnl >= 0 ? '#10b981' : '#ef4444'} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Session Performance (Asia / London / New York)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Buckets by entry time: Asia (21:00-06:59), London (07:00-12:59), New York (13:00-20:59)
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={bySession} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="session" tick={{ fontSize: 11, fill: axisColor }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: axisColor }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} width={52} />
                <Tooltip content={<ChartTooltip formatter={(v: number) => formatCurrency(v)} />} />
                <ReferenceLine y={0} stroke={axisColor} strokeDasharray="3 3" strokeOpacity={0.4} />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]} maxBarSize={62}>
                  {bySession.map((e, i) => <Cell key={i} fill={e.pnl >= 0 ? '#10b981' : '#ef4444'} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="grid md:grid-cols-3 gap-3">
              {bySession.map((s) => (
                <div key={s.session} className="rounded-lg border border-border p-3">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.session}</p>
                  <p className={cn('text-base font-black mt-1 tabular-nums', s.pnl >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                    {formatCurrency(s.pnl)}
                  </p>
                  <div className="mt-2 text-xs text-muted-foreground space-y-1">
                    <p>{s.trades} trade{s.trades !== 1 ? 's' : ''}</p>
                    <p>Win rate: <span className={cn('font-bold', s.winRate >= 50 ? 'text-emerald-500' : 'text-red-500')}>{s.winRate}%</span></p>
                    <p>Expectancy: <span className={cn('font-bold', s.expectancy >= 0 ? 'text-emerald-500' : 'text-red-500')}>{formatCurrency(s.expectancy)}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Entry Time vs P&L</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <ScatterChart margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="hour" name="Hour" type="number" domain={[0, 24]}
                  tick={{ fontSize: 10, fill: axisColor }} tickLine={false} axisLine={false}
                  tickFormatter={v => `${Math.floor(v)}:00`} />
                <YAxis dataKey="pnl" name="P&L" type="number"
                  tick={{ fontSize: 10, fill: axisColor }} tickLine={false} axisLine={false}
                  tickFormatter={v => `$${v}`} width={52} />
                <ReferenceLine y={0} stroke={axisColor} strokeDasharray="3 3" strokeOpacity={0.4} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0]?.payload
                    return (
                      <div className="bg-card border border-border rounded-lg p-2 text-xs">
                        <p className="font-bold">{d?.symbol}</p>
                        <p className="text-muted-foreground">{Math.floor(d?.hour)}:00</p>
                        <p className={d?.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}>{formatCurrency(d?.pnl)}</p>
                      </div>
                    )
                  }} />
                <Scatter data={scatter} shape={(props: any) => {
                  const { cx, cy, payload } = props
                  return <circle cx={cx} cy={cy} r={4} fill={payload.pnl >= 0 ? '#10b981' : '#ef4444'} fillOpacity={0.7} stroke="none" />
                }} />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ══════════════ SYMBOLS TAB ══════════════ */}
      <TabsContent value="behavior" className="space-y-6">
        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Performance by Emotion</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byEmotion} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="emotion" tick={{ fontSize: 10, fill: axisColor }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: axisColor }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} width={52} />
                  <Tooltip content={<ChartTooltip formatter={(v: number) => formatCurrency(v)} />} />
                  <ReferenceLine y={0} stroke={axisColor} strokeDasharray="3 3" strokeOpacity={0.4} />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]} maxBarSize={44}>
                    {byEmotion.map((e, i) => <Cell key={i} fill={e.pnl >= 0 ? '#10b981' : '#ef4444'} fillOpacity={0.85} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Performance by Grade</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byGrade} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="grade" tick={{ fontSize: 10, fill: axisColor }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: axisColor }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} width={52} />
                  <Tooltip content={<ChartTooltip formatter={(v: number) => formatCurrency(v)} />} />
                  <ReferenceLine y={0} stroke={axisColor} strokeDasharray="3 3" strokeOpacity={0.4} />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]} maxBarSize={44}>
                    {byGrade.map((e, i) => <Cell key={i} fill={e.pnl >= 0 ? '#10b981' : '#ef4444'} fillOpacity={0.85} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Behavior Summary</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Emotion insights</p>
              {byEmotion.length > 0 ? (
                <div className="space-y-1">
                  <p>Best emotion: <span className="font-bold">{byEmotion[0].emotion}</span> ({formatCurrency(byEmotion[0].pnl)})</p>
                  <p>Highest expectancy: <span className="font-bold">{[...byEmotion].sort((a, b) => b.expectancy - a.expectancy)[0].emotion}</span></p>
                  <p>Most used: <span className="font-bold">{[...byEmotion].sort((a, b) => b.trades - a.trades)[0].emotion}</span></p>
                </div>
              ) : (
                <p className="text-muted-foreground">No emotion data in this range.</p>
              )}
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Grade insights</p>
              {byGrade.length > 0 ? (
                <div className="space-y-1">
                  <p>Best grade: <span className="font-bold">{byGrade[0].grade}</span> ({formatCurrency(byGrade[0].pnl)})</p>
                  <p>Highest expectancy: <span className="font-bold">{[...byGrade].sort((a, b) => b.expectancy - a.expectancy)[0].grade}</span></p>
                  <p>Most used: <span className="font-bold">{[...byGrade].sort((a, b) => b.trades - a.trades)[0].grade}</span></p>
                </div>
              ) : (
                <p className="text-muted-foreground">No grade data in this range.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="symbols" className="space-y-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Performance by Symbol</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Symbol', 'Trades', 'Win Rate', 'Total P/L', 'Avg P/L'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bySymbol.map(row => (
                  <tr key={row.symbol} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                    <td className="px-5 py-3 font-black">{row.symbol}</td>
                    <td className="px-5 py-3 text-muted-foreground">{row.trades}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${row.winRate}%` }} />
                        </div>
                        <span className={cn('text-xs font-bold', row.winRate >= 50 ? 'text-emerald-500' : 'text-red-500')}>
                          {row.winRate}%
                        </span>
                      </div>
                    </td>
                    <td className={cn('px-5 py-3 font-bold tabular-nums', row.pnl >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                      {formatCurrency(row.pnl)}
                    </td>
                    <td className={cn('px-5 py-3 text-xs tabular-nums', row.pnl / row.trades >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                      {formatCurrency(row.pnl / row.trades)}/trade
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Total P/L by Symbol</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={bySymbol} layout="vertical" margin={{ top: 4, right: 60, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: axisColor }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                <YAxis type="category" dataKey="symbol" tick={{ fontSize: 11, fill: axisColor, fontWeight: 700 }} tickLine={false} axisLine={false} width={36} />
                <Tooltip content={<ChartTooltip formatter={(v: number) => formatCurrency(v)} />} />
                <ReferenceLine x={0} stroke={axisColor} strokeDasharray="3 3" strokeOpacity={0.4} />
                <Bar dataKey="pnl" radius={[0, 4, 4, 0]} maxBarSize={28}
                  label={{ position: 'right', fontSize: 10, fill: axisColor, formatter: (v: any) => typeof v === 'number' ? `${v >= 0 ? '+' : ''}$${Math.abs(v).toFixed(0)}` : '' }}>
                  {bySymbol.map((e, i) => <Cell key={i} fill={e.pnl >= 0 ? '#10b981' : '#ef4444'} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}



