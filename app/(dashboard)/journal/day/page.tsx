/* eslint-disable @typescript-eslint/no-explicit-any */

import { redirect } from 'next/navigation'
import { and, desc, eq, gte, inArray, lte } from 'drizzle-orm'
import { DayJournalClient } from '@/components/journal/DayJournalClient'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { playbooks, propFirmAccounts, propFirms, tradeMistakes, trades } from '@/lib/db/schema'

interface Props {
  searchParams: Promise<{
    date?: string
    start?: string
    end?: string
    accountId?: string
  }>
}

function getUtcDayLabel(dateParam: string): string {
  const [y, m, d] = dateParam.split('-').map(Number)
  const date = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0))
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

export default async function JournalDayPage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const resolved = await searchParams
  const dateParam = resolved?.date
  const startParam = resolved?.start
  const endParam = resolved?.end
  const accountId = resolved?.accountId ?? null

  if (!dateParam || !startParam || !endParam) {
    redirect('/journal')
  }

  const start = new Date(startParam)
  const end = new Date(endParam)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    redirect('/journal')
  }

  const where = accountId
    ? and(
      eq(trades.userId, session.user.id),
      eq(trades.propFirmAccountId, accountId),
      gte(trades.exitTime, start),
      lte(trades.exitTime, end),
    )
    : and(
      eq(trades.userId, session.user.id),
      gte(trades.exitTime, start),
      lte(trades.exitTime, end),
    )

  const [dayTrades, userPlaybooks] = await Promise.all([
    db.query.trades.findMany({
      where,
      orderBy: [desc(trades.exitTime)],
    }),
    db.query.playbooks.findMany({
      where: eq(playbooks.userId, session.user.id),
    }),
  ])

  const tradeIds = dayTrades.map(t => t.id)
  const mistakes = tradeIds.length > 0
    ? await db.query.tradeMistakes.findMany({
      where: and(
        eq(tradeMistakes.userId, session.user.id),
        inArray(tradeMistakes.tradeId, tradeIds),
      ),
    })
    : []

  let accountLabel: string | null = null
  if (accountId) {
    const [account] = await db
      .select({
        firmName: propFirms.name,
        accountLabel: propFirmAccounts.accountLabel,
      })
      .from(propFirmAccounts)
      .leftJoin(propFirms, eq(propFirmAccounts.propFirmId, propFirms.id))
      .where(
        and(
          eq(propFirmAccounts.id, accountId),
          eq(propFirmAccounts.userId, session.user.id),
        )
      )
      .limit(1)

    if (account) accountLabel = `${account.firmName ?? 'Account'} - ${account.accountLabel}`
  }

  return (
    <DayJournalClient
      dayLabel={getUtcDayLabel(dateParam)}
      trades={dayTrades as any}
      playbooks={userPlaybooks as any}
      mistakes={mistakes as any}
      accountLabel={accountLabel}
      startIso={start.toISOString()}
      endIso={end.toISOString()}
      accountId={accountId}
    />
  )
}
