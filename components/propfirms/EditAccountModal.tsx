'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  toFundedRulesConfig,
} from '@/lib/propfirmPresets'
import type { PropFirmAccount, PropFirmCustomRules } from '@/lib/db/schema'

interface Props {
  account: PropFirmAccount | null
  onClose: () => void
  onSaved: () => void
}

function serializeFundedCustomRules(input: {
  stage: string
  minTradeDays: string
  minDailyProfitUsd: string
  minBalanceToRequestUsd: string
  maxConsistencyPercent: string
  notes: string
}): PropFirmCustomRules {
  if (input.stage !== 'funded') return []
  return {
    payout: {
      minTradeDays: input.minTradeDays ? Number(input.minTradeDays) : undefined,
      minDailyProfitUsd: input.minDailyProfitUsd ? Number(input.minDailyProfitUsd) : undefined,
      minBalanceToRequestUsd: input.minBalanceToRequestUsd ? Number(input.minBalanceToRequestUsd) : undefined,
      maxConsistencyPercent: input.maxConsistencyPercent ? Number(input.maxConsistencyPercent) : undefined,
      notes: input.notes.trim()
        ? input.notes.split('\n').map(note => note.trim()).filter(Boolean)
        : undefined,
    },
  }
}

export function EditAccountModal({ account, onClose, onSaved }: Props) {
  const [stage, setStage] = useState('evaluation')
  const [profitTarget, setProfitTarget] = useState('')
  const [maxDrawdown, setMaxDrawdown] = useState('')
  const [hasDailyLimit, setHasDailyLimit] = useState(true)
  const [dailyLossLimit, setDailyLossLimit] = useState('')
  const [minTradingDays, setMinTradingDays] = useState('')
  const [maxTradingDays, setMaxTradingDays] = useState('')
  const [isTrailingDrawdown, setIsTrailingDrawdown] = useState(false)
  const [consistencyRule, setConsistencyRule] = useState(false)
  const [newsTrading, setNewsTrading] = useState(true)
  const [weekendHolding, setWeekendHolding] = useState(false)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [fundedMinTradeDays, setFundedMinTradeDays] = useState('')
  const [fundedMinDailyProfit, setFundedMinDailyProfit] = useState('')
  const [fundedMinBalance, setFundedMinBalance] = useState('')
  const [fundedMaxConsistencyPercent, setFundedMaxConsistencyPercent] = useState('')
  const [fundedRuleNotes, setFundedRuleNotes] = useState('')

  const open = !!account

  useEffect(() => {
    if (!account) return
    setStage(account.stage === 'funded' ? 'funded' : 'evaluation')
    setProfitTarget(account.profitTarget != null ? String(account.profitTarget) : '')
    setMaxDrawdown(account.maxDrawdown != null ? String(account.maxDrawdown) : '')
    const accountDailyLimit = account.dailyLossLimit != null ? Number(account.dailyLossLimit) : 0
    setHasDailyLimit(accountDailyLimit > 0)
    setDailyLossLimit(accountDailyLimit > 0 ? String(accountDailyLimit) : '')
    setMinTradingDays(account.minTradingDays != null ? String(account.minTradingDays) : '')
    setMaxTradingDays(account.maxTradingDays != null ? String(account.maxTradingDays) : '')
    setIsTrailingDrawdown(Boolean(account.isTrailingDrawdown))
    setConsistencyRule(Boolean(account.consistencyRule))
    setNewsTrading(Boolean(account.newsTrading))
    setWeekendHolding(Boolean(account.weekendHolding))
    setNotes(account.notes ?? '')

    const funded = toFundedRulesConfig(account.customRules)
    setFundedMinTradeDays(funded?.payout?.minTradeDays != null ? String(funded.payout.minTradeDays) : '')
    setFundedMinDailyProfit(funded?.payout?.minDailyProfitUsd != null ? String(funded.payout.minDailyProfitUsd) : '')
    setFundedMinBalance(funded?.payout?.minBalanceToRequestUsd != null ? String(funded.payout.minBalanceToRequestUsd) : '')
    setFundedMaxConsistencyPercent(funded?.payout?.maxConsistencyPercent != null ? String(funded.payout.maxConsistencyPercent) : '')
    setFundedRuleNotes((funded?.payout?.notes ?? []).join('\n'))
  }, [account])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!account) return

    setLoading(true)
    try {
      const res = await fetch(`/api/propfirms/accounts/${account.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage,
          profitTarget: profitTarget ? Number(profitTarget) : null,
          maxDrawdown: maxDrawdown ? Number(maxDrawdown) : null,
          dailyLossLimit: hasDailyLimit && dailyLossLimit ? Number(dailyLossLimit) : null,
          minTradingDays: minTradingDays ? Number(minTradingDays) : null,
          maxTradingDays: maxTradingDays ? Number(maxTradingDays) : null,
          isTrailingDrawdown,
          consistencyRule,
          newsTrading,
          weekendHolding,
          customRules: serializeFundedCustomRules({
            stage,
            minTradeDays: fundedMinTradeDays,
            minDailyProfitUsd: fundedMinDailyProfit,
            minBalanceToRequestUsd: fundedMinBalance,
            maxConsistencyPercent: fundedMaxConsistencyPercent,
            notes: fundedRuleNotes,
          }),
          notes,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to update account')
        return
      }
      toast.success('Account updated')
      onSaved()
    } catch {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={nextOpen => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Account</DialogTitle>
          <DialogDescription>Update stage and account rules</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Account Stage</Label>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="evaluation">Evaluation</SelectItem>
                <SelectItem value="funded">Funded Account</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {stage === 'funded' && (
            <div className="space-y-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-500">Funded Payout Rules</p>
              <p className="text-[11px] text-muted-foreground">
                Enter only the payout tracking rules you care about.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Min Trade Days</Label>
                  <Input type="number" value={fundedMinTradeDays} onChange={e => setFundedMinTradeDays(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Min Daily Profit ($)</Label>
                  <Input type="number" value={fundedMinDailyProfit} onChange={e => setFundedMinDailyProfit(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Min Balance To Request ($)</Label>
                  <Input type="number" value={fundedMinBalance} onChange={e => setFundedMinBalance(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Max Consistency Day (%)</Label>
                  <Input type="number" value={fundedMaxConsistencyPercent} onChange={e => setFundedMaxConsistencyPercent(e.target.value)} placeholder="e.g. 50" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Funded Rule Notes</Label>
                <Textarea
                  value={fundedRuleNotes}
                  onChange={e => setFundedRuleNotes(e.target.value)}
                  placeholder="Optional notes from funded policy..."
                  className="min-h-16 resize-y"
                />
              </div>
            </div>
          )}

          {stage !== 'funded' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Profit Target ($)</Label>
                  <Input type="number" value={profitTarget} onChange={e => setProfitTarget(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Max Drawdown ($)</Label>
                  <Input type="number" value={maxDrawdown} onChange={e => setMaxDrawdown(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Min Trading Days</Label>
                  <Input type="number" value={minTradingDays} onChange={e => setMinTradingDays(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Max Trading Days</Label>
                  <Input type="number" value={maxTradingDays} onChange={e => setMaxTradingDays(e.target.value)} />
                </div>
              </div>
            </>
          )}

          <div className="bg-muted/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold">Daily Loss Limit</p>
                <p className="text-[10px] text-muted-foreground">
                  {hasDailyLimit ? 'Max loss allowed in one trading day' : 'No daily loss limit'}
                </p>
              </div>
              <Switch checked={hasDailyLimit} onCheckedChange={v => {
                setHasDailyLimit(v)
                if (!v) setDailyLossLimit('')
              }} />
            </div>
            {hasDailyLimit && (
              <Input type="number" value={dailyLossLimit} onChange={e => setDailyLossLimit(e.target.value)} />
            )}
          </div>

          <div className="space-y-3 bg-muted/30 rounded-xl p-4">
            {[
              { label: 'Trailing Drawdown', value: isTrailingDrawdown, set: setIsTrailingDrawdown },
              { label: '30% Consistency Rule', value: consistencyRule, set: setConsistencyRule },
              { label: 'News Trading Allowed', value: newsTrading, set: setNewsTrading },
              { label: 'Weekend Holding', value: weekendHolding, set: setWeekendHolding },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between gap-4">
                <p className="text-xs font-semibold">{item.label}</p>
                <Switch checked={item.value} onCheckedChange={item.set} />
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Notes</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Extra reminders for this account..."
              className="min-h-20 resize-y"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black font-bold"
            >
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
