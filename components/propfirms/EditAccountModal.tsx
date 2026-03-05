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
import type { PropFirmAccount } from '@/lib/db/schema'

interface Props {
  account: PropFirmAccount | null
  onClose: () => void
  onSaved: () => void
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
            <Select
              value={stage}
              onValueChange={setStage}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="evaluation">Evaluation / Challenge</SelectItem>
                <SelectItem value="funded">Funded Account</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
