/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server'
import { and, eq, gte, inArray, lte } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { tradeMistakes, trades } from '@/lib/db/schema'
import { getTradeTotalPnl } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const GEMINI_KEY = process.env.GEMINI_API_KEY
  if (!GEMINI_KEY) return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 })

  try {
    const { start, end, accountId, dayLabel } = await req.json()
    if (!start || !end) return NextResponse.json({ error: 'start and end are required' }, { status: 400 })

    const startDate = new Date(start)
    const endDate = new Date(end)
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date range' }, { status: 400 })
    }

    const where = accountId
      ? and(
        eq(trades.userId, session.user.id),
        eq(trades.propFirmAccountId, accountId),
        gte(trades.exitTime, startDate),
        lte(trades.exitTime, endDate),
      )
      : and(
        eq(trades.userId, session.user.id),
        gte(trades.exitTime, startDate),
        lte(trades.exitTime, endDate),
      )

    const dayTrades = await db.query.trades.findMany({
      where,
      orderBy: [trades.exitTime],
    })

    if (dayTrades.length === 0) {
      return NextResponse.json({ error: 'No trades found for this day' }, { status: 404 })
    }

    const tradeIds = dayTrades.map(t => t.id)
    const dayMistakes = tradeIds.length > 0
      ? await db.query.tradeMistakes.findMany({
        where: and(
          eq(tradeMistakes.userId, session.user.id),
          inArray(tradeMistakes.tradeId, tradeIds),
        ),
      })
      : []

    const pnls = dayTrades.map(getTradeTotalPnl)
    const wins = pnls.filter(p => p > 0).length
    const losses = pnls.filter(p => p < 0).length
    const netPnl = pnls.reduce((sum, p) => sum + p, 0)
    const winRate = dayTrades.length ? (wins / dayTrades.length) * 100 : 0
    const avgWin = wins > 0 ? pnls.filter(p => p > 0).reduce((s, p) => s + p, 0) / wins : 0
    const avgLoss = losses > 0 ? Math.abs(pnls.filter(p => p < 0).reduce((s, p) => s + p, 0) / losses) : 0

    const bySymbol: Record<string, { pnl: number; trades: number; wins: number }> = {}
    dayTrades.forEach(t => {
      if (!bySymbol[t.symbol]) bySymbol[t.symbol] = { pnl: 0, trades: 0, wins: 0 }
      const pnl = getTradeTotalPnl(t)
      bySymbol[t.symbol].pnl += pnl
      bySymbol[t.symbol].trades++
      if (pnl > 0) bySymbol[t.symbol].wins++
    })
    const symbolRows = Object.entries(bySymbol)
      .map(([symbol, s]) => ({ symbol, ...s }))
      .sort((a, b) => b.pnl - a.pnl)

    const mistakeCounts: Record<string, number> = {}
    dayMistakes.forEach(m => {
      mistakeCounts[m.mistakeType] = (mistakeCounts[m.mistakeType] ?? 0) + 1
    })

    const payload = {
      dayLabel: dayLabel ?? new Date(startDate).toLocaleDateString('en-US'),
      trades: dayTrades.length,
      netPnl: Number(netPnl.toFixed(2)),
      wins,
      losses,
      winRate: Number(winRate.toFixed(1)),
      avgWin: Number(avgWin.toFixed(2)),
      avgLoss: Number(avgLoss.toFixed(2)),
      symbols: symbolRows.map(s => ({
        symbol: s.symbol,
        pnl: Number(s.pnl.toFixed(2)),
        trades: s.trades,
        winRate: s.trades ? Math.round((s.wins / s.trades) * 100) : 0,
      })),
      topMistakes: Object.entries(mistakeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([type, count]) => ({ type, count })),
      mistakeCount: dayMistakes.length,
    }

    const systemPrompt = `You are an elite intraday trading coach.
Return ONLY valid JSON with this exact schema:
{
  "headline": "<max 10 words>",
  "score": <number 1-100>,
  "summary": "<max 30 words>",
  "strengths": ["<max 2 items, each <= 8 words>"],
  "improvements": ["<max 2 items, each <= 8 words>"],
  "oneAction": "<max 12 words>"
}
Keep it concise, specific, and data-backed. No filler.`

    const userPrompt = `Summarize this trading day:\n${JSON.stringify(payload, null, 2)}`

    const aiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.35,
            maxOutputTokens: 600,
            responseMimeType: 'application/json',
          },
        }),
      }
    )

    const data = await aiRes.json()
    if (!aiRes.ok) {
      return NextResponse.json(
        { error: data?.error?.message ?? 'AI request failed' },
        { status: 502 }
      )
    }

    const raw = data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? '')
      .join('')
      .trim() ?? ''

    try {
      const summary = JSON.parse(raw.replace(/```json|```/g, '').trim())
      return NextResponse.json({ summary })
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Unexpected error' }, { status: 500 })
  }
}
