'use client'

// components/propfirms/AddAccountModal.tsx

import { useState } from 'react'
import { getTradeTotalPnl } from '@/lib/utils'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { Trade } from '@/lib/db/schema'

// ── Prop firm presets ─────────────────────────────────────
const PROP_FIRMS = [
  {
    firm: 'Apex',
    accounts: [
      // EOD Trailing Drawdown Program (Legacy Full - most common)
      { label: 'Apex 25K Eval',  accountSize: 25000,    profitTarget: 1500,  maxDrawdown: 1500,  dailyLossLimit: 0,    hasDailyLimit: false, minDays: 0,  maxDays: 30, trailing: true,  consistency50: false },
      { label: 'Apex 50K Eval',  accountSize: 50000,    profitTarget: 3000,  maxDrawdown: 2500,  dailyLossLimit: 0,    hasDailyLimit: false, minDays: 0,  maxDays: 30, trailing: true,  consistency50: false },
      { label: 'Apex 100K Eval', accountSize: 100000,   profitTarget: 6000,  maxDrawdown: 3000,  dailyLossLimit: 0,    hasDailyLimit: false, minDays: 0,  maxDays: 30, trailing: true,  consistency50: false },
      { label: 'Apex 150K Eval', accountSize: 150000,   profitTarget: 9000,  maxDrawdown: 5000,  dailyLossLimit: 0,    hasDailyLimit: false, minDays: 0,  maxDays: 30, trailing: true,  consistency50: false },
    ],
  },
  {
    firm: 'TPT',
    accounts: [
      // Take Profit Trader - DLL removed per JSON; min 5 trading days
      { label: 'TPT 25K Eval', accountSize: 25000,     profitTarget: 1500,     maxDrawdown: 1500,     dailyLossLimit: 0,    hasDailyLimit: false, minDays: 5,  maxDays: 0,    trailing: false,  consistency50: false }, // [VERIFY] exact values
      { label: 'TPT 50K Eval', accountSize: 50000,     profitTarget: 3000,     maxDrawdown: 2000,     dailyLossLimit: 0,    hasDailyLimit: false, minDays: 5,  maxDays: 0,    trailing: false,  consistency50: false }, // [VERIFY] exact values
      { label: 'TPT 75K Eval', accountSize: 75000,     profitTarget: 4500,     maxDrawdown: 2500,     dailyLossLimit: 0,    hasDailyLimit: false, minDays: 5,  maxDays: 0,    trailing: false,  consistency50: false }, // [VERIFY] exact values
      { label: 'TPT 100K Eval', accountSize: 100000,    profitTarget: 6000,     maxDrawdown: 3000,     dailyLossLimit: 0,    hasDailyLimit: false, minDays: 5,  maxDays: 0,    trailing: false,  consistency50: false }, // [VERIFY] exact values
      { label: 'TPT 150K Eval', accountSize: 150000,    profitTarget: 9000,     maxDrawdown: 5000,     dailyLossLimit: 0,    hasDailyLimit: false, minDays: 5,  maxDays: 0,    trailing: false,  consistency50: false }, // [VERIFY] exact values
   ] },
  {
    firm: 'Lucid',
    accounts: [
      // LucidBlack - 2 min days, 60% consistency, no DLL
      { label: 'Lucid Black 25K', accountSize: 25000,  profitTarget: 1250,  maxDrawdown: 1000,  dailyLossLimit: 0,    hasDailyLimit: false, minDays: 2,  maxDays: 0,    trailing: false, consistency50: false, consistencyRule: 60 },
      { label: 'Lucid Black 50K', accountSize: 50000,  profitTarget: 3000,  maxDrawdown: 2000,  dailyLossLimit: 0,    hasDailyLimit: false, minDays: 2,  maxDays: 0,    trailing: false, consistency50: false, consistencyRule: 60 },
      { label: 'Lucid Black 100K', accountSize: 100000, profitTarget: 6000,  maxDrawdown: 3000,  dailyLossLimit: 0,    hasDailyLimit: false, minDays: 2,  maxDays: 0,    trailing: false, consistency50: false, consistencyRule: 60 },
      // LucidFlex - has DLL
      { label: 'Lucid Flex 50K', accountSize: 50000,   profitTarget: 3000,  maxDrawdown: 2000,  dailyLossLimit: 1200, hasDailyLimit: true,  minDays: 0,  maxDays: 0,    trailing: false, consistency50: false },
      { label: 'Lucid Flex 100K', accountSize: 100000,  profitTarget: 6000,  maxDrawdown: 3000,  dailyLossLimit: 1800, hasDailyLimit: true,  minDays: 0,  maxDays: 0,    trailing: false, consistency50: false },
      // LucidDirect - 10 min days, 20% consistency
      { label: 'Lucid Direct 25K', accountSize: 25000, profitTarget: 1500,  maxDrawdown: 0,     dailyLossLimit: 0,    hasDailyLimit: false, minDays: 10, maxDays: 0,    trailing: false, consistency50: false, consistencyRule: 20 }, // [VERIFY] drawdown
      { label: 'Lucid Direct 50K', accountSize: 50000, profitTarget: 3000,  maxDrawdown: 2000,  dailyLossLimit: 1200, hasDailyLimit: true,  minDays: 10, maxDays: 0,    trailing: false, consistency50: false, consistencyRule: 20 },
      { label: 'Lucid Direct 150K', accountSize: 150000, profitTarget: 9000,  maxDrawdown: 6000,  dailyLossLimit: 3600, hasDailyLimit: true,  minDays: 10, maxDays: 0,    trailing: false, consistency50: false, consistencyRule: 20 }, 
 ]},
  { firm: 'Alpha', accounts: [
      { label: 'Alpha 50K Eval', accountSize: 50000,   profitTarget: 3000,  maxDrawdown: 2000,  dailyLossLimit: 0,    hasDailyLimit: false, minDays: 2,  maxDays: 0,    trailing: false,  consistency50: true  }, // [VERIFY] DLL
      { label: 'Alpha 100K Eval', accountSize: 100000,  profitTarget: 6000,  maxDrawdown: 4000,  dailyLossLimit: 0,    hasDailyLimit: false, minDays: 2,  maxDays: 0,    trailing: false,  consistency50: true  }, // [VERIFY] DLL
      { label: 'Alpha 150K Eval', accountSize: 150000,  profitTarget: 9000,  maxDrawdown: 6000,  dailyLossLimit: 0,    hasDailyLimit: false, minDays: 2,  maxDays: 0,    trailing: false,  consistency50: true  }, // [VERIFY] DLL
    ] },  
  {
    firm: 'TopStep',
    accounts: [
      // Trading Combine - trailing MLL, 50% consistency, 2 min days
      { label: 'TopStep 50K', accountSize: 50000, profitTarget: 3000,  maxDrawdown: 2000,  dailyLossLimit: 1000, hasDailyLimit: true,  minDays: 2,  maxDays: 0,    trailing: false,  consistency50: true  },
      { label: 'TopStep 100K', accountSize: 100000, profitTarget: 6000,  maxDrawdown: 3000,  dailyLossLimit: 2000, hasDailyLimit: true,  minDays: 2,  maxDays: 0,    trailing: false,  consistency50: true  },
      { label: 'TopStep 150K', accountSize: 150000, profitTarget: 9000,  maxDrawdown: 4500,  dailyLossLimit: 3000, hasDailyLimit: true,  minDays: 2,  maxDays: 0,    trailing: false,  consistency50: true  },
    ],
  },
  {
    firm: 'MFF',
    accounts: [
      // Rapid Plan - EOD trailing, 50% consistency eval only, 2 min days
      { label: 'MFF Rapid 50K', accountSize: 50000, profitTarget: 3000,  maxDrawdown: 2000,  dailyLossLimit: 0,    hasDailyLimit: false, minDays: 2,  maxDays: 0,    trailing: false,  consistency50: true  },
      // Scale Plan - EOD trailing, no DLL
      { label: 'MFF Scale 50K', accountSize: 50000, profitTarget: 3000,  maxDrawdown: 2000,  dailyLossLimit: 0,    hasDailyLimit: false, minDays: 0,  maxDays: 0,    trailing: false,  consistency50: true },
      { label: 'MFF Scale 100K', accountSize: 100000, profitTarget: 0,     maxDrawdown: 3000,  dailyLossLimit: 0,    hasDailyLimit: false, minDays: 0,  maxDays: 0,    trailing: false,  consistency50: true }, // [VERIFY] profit target
      { label: 'MFF Scale 150K', accountSize: 150000, profitTarget: 0,     maxDrawdown: 4500,  dailyLossLimit: 0,    hasDailyLimit: false, minDays: 0,  maxDays: 0,    trailing: false,  consistency50: true }, // [VERIFY] profit target
    ],
  },
  {
    firm: 'Tradeify',
    accounts: [
      // SELECT Program - EOD trailing, 40% consistency eval, 3 min days, no DLL in eval
      { label: 'Tradeify Select 50K',  accountSize: 50000,  profitTarget: 2500,  maxDrawdown: 2000,  dailyLossLimit: 0,    hasDailyLimit: false, minDays: 3,  maxDays: 0,    trailing: false,  consistency50: false, consistencyRule: 40 },
      { label: 'Tradeify Select 100K', accountSize: 100000, profitTarget: 6000,  maxDrawdown: 3000,  dailyLossLimit: 0,    hasDailyLimit: false, minDays: 3,  maxDays: 0,    trailing: false,  consistency50: false, consistencyRule: 40 },
      { label: 'Tradeify Select 150K', accountSize: 150000, profitTarget: 9000,  maxDrawdown: 4500,  dailyLossLimit: 0,    hasDailyLimit: false, minDays: 3,  maxDays: 0,    trailing: false,  consistency50: false, consistencyRule: 40 },
      // GROWTH Program - EOD trailing, has DLL, no min days
      { label: 'Tradeify Growth 50K',  accountSize: 50000,  profitTarget: 3000,  maxDrawdown: 2000,  dailyLossLimit: 1250, hasDailyLimit: true,  minDays: 0,  maxDays: 0,    trailing: true,  consistency50: false },
      { label: 'Tradeify Growth 100K', accountSize: 100000, profitTarget: 6000,  maxDrawdown: 3500,  dailyLossLimit: 2500, hasDailyLimit: true,  minDays: 0,  maxDays: 0,    trailing: true,  consistency50: false },
      { label: 'Tradeify Growth 150K', accountSize: 150000, profitTarget: 9000,  maxDrawdown: 5000,  dailyLossLimit: 3750, hasDailyLimit: true,  minDays: 0,  maxDays: 0,    trailing: true,  consistency50: false },
    ],
  },
]

const FIRM_BUTTON_LABEL: Record<string, string> = {
  Apex: 'Apex',
  TPT: 'TPT',
  Lucid: 'Lucid',
  Alpha: 'Alpha',
  TopStep: 'TopStep',
  MFF: 'MFFU',
  Tradeify: 'Tradeify',
}

interface Props {
  firmId: string | null
  onClose: () => void
  onSaved: () => void
  allTrades: Trade[]
}

export function AddAccountModal({ firmId, onClose, onSaved, allTrades }: Props) {
  const [accountLabel, setAccountLabel] = useState('')
  const [accountSize, setAccountSize] = useState('')
  const [stage, setStage] = useState('evaluation')
  const [profitTarget, setProfitTarget] = useState('')
  const [maxDrawdown, setMaxDrawdown] = useState('')
  const [hasDailyLimit, setHasDailyLimit] = useState(true)
  const [dailyLossLimit, setDailyLossLimit] = useState('')
  const [minTradingDays, setMinTradingDays] = useState('')
  const [maxTradingDays, setMaxTradingDays] = useState('')
  const [isTrailingDD, setIsTrailingDD] = useState(false)
  const [consistency50, setConsistency50] = useState(false)
  const [consistencyRule, setConsistencyRule] = useState(false)
  const [newsTrading, setNewsTrading] = useState(true)
  const [weekendHolding, setWeekendHolding] = useState(false)
  const [notes, setNotes] = useState('')
  const [linkedTradeIds, setLinkedTradeIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedFirm, setSelectedFirm] = useState<string | null>(null)
  const [customFirmName, setCustomFirmName] = useState('')

  function applyPreset(preset: typeof PROP_FIRMS[0]['accounts'][0]) {
    setAccountLabel(preset.label)
    setAccountSize(String(preset.accountSize))
    setProfitTarget(String(preset.profitTarget))
    setMaxDrawdown(String(preset.maxDrawdown))
    setHasDailyLimit(preset.hasDailyLimit)
    setDailyLossLimit(preset.hasDailyLimit && preset.dailyLossLimit > 0 ? String(preset.dailyLossLimit) : '')
    setMinTradingDays(preset.minDays > 0 ? String(preset.minDays) : '')
    setMaxTradingDays(preset.maxDays > 0 ? String(preset.maxDays) : '')
    setIsTrailingDD(preset.trailing)
    setConsistency50(preset.consistency50)
  }

  const unlinkedTrades = allTrades.filter(t => !t.propFirmAccountId)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!firmId) return
    setLoading(true)
    try {
      const res = await fetch('/api/propfirms/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firmId,
          accountLabel,
          accountSize: Number(accountSize),
          stage,
          profitTarget: profitTarget ? Number(profitTarget) : null,
          maxDrawdown: maxDrawdown ? Number(maxDrawdown) : null,
          dailyLossLimit: hasDailyLimit && dailyLossLimit ? Number(dailyLossLimit) : null,
          minTradingDays: minTradingDays ? Number(minTradingDays) : null,
          maxTradingDays: maxTradingDays ? Number(maxTradingDays) : null,
          isTrailingDrawdown: isTrailingDD,
          consistencyRule50: consistency50,
          consistencyRule,
          newsTrading,
          weekendHolding,
          notes,
          linkedTradeIds,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Failed'); return }
      toast.success('Account added!')
      onSaved()
    } catch { toast.error('Network error') }
    finally { setLoading(false) }
  }

  return (
    <Dialog open={!!firmId} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Prop Firm Account</DialogTitle>
          <DialogDescription>Set account rules and link your trades</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-5">

          {/* ── Prop firm quick-fill ── */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
              Quick Fill — Select Your Prop Firm
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {PROP_FIRMS.map(f => (
                <button key={f.firm} type="button"
                  onClick={() => setSelectedFirm(selectedFirm === f.firm ? null : f.firm)}
                  className={cn(
                    'text-xs px-2.5 py-1.5 rounded-lg border font-semibold transition-all',
                    selectedFirm === f.firm
                      ? 'bg-emerald-500 text-black border-emerald-500'
                      : 'border-border text-muted-foreground hover:text-foreground hover:border-emerald-500/40 hover:bg-emerald-500/5'
                  )}>
                  {FIRM_BUTTON_LABEL[f.firm] ?? f.firm}
                </button>
              ))}
              {/* Custom / Other firm */}
              <button type="button"
                onClick={() => setSelectedFirm(selectedFirm === 'custom' ? null : 'custom')}
                className={cn(
                  'text-xs px-2.5 py-1.5 rounded-lg border font-semibold transition-all',
                  selectedFirm === 'custom'
                    ? 'bg-emerald-500 text-black border-emerald-500'
                    : 'border-dashed border-border text-muted-foreground hover:text-foreground hover:border-emerald-500/40 hover:bg-emerald-500/5'
                )}>
                + Other
              </button>
            </div>

            {/* Preset accounts for known firms */}
            {selectedFirm && selectedFirm !== 'custom' && (
              <div className="grid grid-cols-2 gap-1.5 pt-1 animate-in fade-in-0 slide-in-from-top-1 duration-200">
                {PROP_FIRMS.find(f => f.firm === selectedFirm)?.accounts.map(preset => (
                  <button key={preset.label} type="button" onClick={() => applyPreset(preset)}
                    className={cn(
                      'text-left rounded-xl border p-3 transition-all',
                      accountLabel === preset.label
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-border hover:border-emerald-500/40 hover:bg-emerald-500/5'
                    )}>
                    <p className="text-xs font-bold">{preset.label}</p>
                    <div className="flex flex-wrap gap-x-2 mt-1">
                      <span className="text-[10px] text-emerald-500">+${preset.profitTarget.toLocaleString()}</span>
                      <span className="text-[10px] text-red-400">DD ${preset.maxDrawdown.toLocaleString()}</span>
                      {!preset.hasDailyLimit && <span className="text-[10px] text-amber-400">No daily limit</span>}
                      {preset.consistency50 && <span className="text-[10px] text-purple-400">50% rule</span>}
                      {preset.trailing && <span className="text-[10px] text-blue-400">Trailing</span>}
                      {preset.minDays > 0 && <span className="text-[10px] text-muted-foreground">{preset.minDays} min days</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Custom firm — just a name hint, fill rules manually below */}
            {selectedFirm === 'custom' && (
              <div className="pt-1 animate-in fade-in-0 slide-in-from-top-1 duration-200">
                <div className="rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 p-3 space-y-2">
                  <p className="text-xs font-semibold text-amber-500">Custom Prop Firm</p>
                  <p className="text-[10px] text-muted-foreground">
                    Fill in your firm&apos;s rules manually in the fields below. No presets — full control.
                  </p>
                  <Input
                    placeholder="Firm name (e.g. E8 Funding, Funded Engineer...)"
                    value={customFirmName}
                    onChange={e => {
                      setCustomFirmName(e.target.value)
                      setAccountLabel(e.target.value)
                    }}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Account basics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Account Label</Label>
              <Input value={accountLabel} onChange={e => setAccountLabel(e.target.value)}
                placeholder="e.g. 50K Eval #1" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Account Size ($)</Label>
              <Input type="number" value={accountSize} onChange={e => setAccountSize(e.target.value)}
                placeholder="50000" required />
            </div>
          </div>

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

          <Separator />

          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account Rules</p>
          <p className="text-[11px] text-muted-foreground -mt-3">
            If your prop firm is new or rules changed, enter your own values here.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Profit Target ($)</Label>
              <Input type="number" value={profitTarget} onChange={e => setProfitTarget(e.target.value)} placeholder="e.g. 3000" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Max Drawdown ($)</Label>
              <Input type="number" value={maxDrawdown} onChange={e => setMaxDrawdown(e.target.value)} placeholder="e.g. 2500" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Min Trading Days</Label>
              <Input type="number" value={minTradingDays} onChange={e => setMinTradingDays(e.target.value)} placeholder="e.g. 7" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Max Trading Days</Label>
              <Input type="number" value={maxTradingDays} onChange={e => setMaxTradingDays(e.target.value)} placeholder="0 = unlimited" />
            </div>
          </div>

          {/* Daily Loss Limit — toggleable */}
          <div className="bg-muted/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold">Daily Loss Limit</p>
                <p className="text-[10px] text-muted-foreground">
                  {hasDailyLimit ? 'Max loss allowed in a single trading day' : 'This firm has no daily loss limit'}
                </p>
              </div>
              <Switch checked={hasDailyLimit} onCheckedChange={v => {
                setHasDailyLimit(v)
                if (!v) setDailyLossLimit('')
              }} />
            </div>
            {hasDailyLimit && (
              <Input type="number" value={dailyLossLimit} onChange={e => setDailyLossLimit(e.target.value)}
                placeholder="e.g. 1000" className="h-8 text-xs" />
            )}
          </div>

          {/* Other rule toggles */}
          <div className="space-y-3 bg-muted/30 rounded-xl p-4">
            {[
              { label: 'Trailing Drawdown', desc: 'Drawdown tracks your peak balance (Apex, TPT, MFF)', value: isTrailingDD, set: setIsTrailingDD },
              { label: '50% Consistency Rule', desc: 'Best single day ≤ 50% of profit target — can\'t pass in 1 day (Apex eval)', value: consistency50, set: setConsistency50 },
              { label: '30% Consistency Rule', desc: 'Best day must be ≤ 30% of total profit earned', value: consistencyRule, set: setConsistencyRule },
              { label: 'News Trading Allowed', desc: 'Can trade during high-impact news events', value: newsTrading, set: setNewsTrading },
              { label: 'Weekend Holding', desc: 'Positions can be held over the weekend', value: weekendHolding, set: setWeekendHolding },
            ].map(item => (
              <div key={item.label} className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xs font-semibold">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{item.desc}</p>
                </div>
                <Switch checked={item.value} onCheckedChange={item.set} className="shrink-0 mt-0.5" />
              </div>
            ))}
          </div>

          <Separator />

          {/* Link trades */}
          {unlinkedTrades.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Link Trades ({linkedTradeIds.length} selected)
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Select trades to link to this account. Progress bars will use linked trades only.
              </p>
              <div className="max-h-36 overflow-y-auto border border-border rounded-lg divide-y divide-border">
                <label className="flex items-center gap-2 px-3 py-2 hover:bg-accent/40 cursor-pointer bg-muted/30">
                  <input type="checkbox"
                    checked={linkedTradeIds.length === unlinkedTrades.length}
                    onChange={e => setLinkedTradeIds(e.target.checked ? unlinkedTrades.map(t => t.id) : [])}
                    className="rounded"
                  />
                  <span className="text-xs font-semibold">Select all ({unlinkedTrades.length} trades)</span>
                </label>
                {unlinkedTrades.slice(0, 50).map(t => (
                  <label key={t.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-accent/40 cursor-pointer">
                    <input type="checkbox"
                      checked={linkedTradeIds.includes(t.id)}
                      onChange={e => setLinkedTradeIds(prev =>
                        e.target.checked ? [...prev, t.id] : prev.filter(id => id !== t.id)
                      )}
                      className="rounded"
                    />
                    <span className="text-xs font-mono">{t.symbol}</span>
                    <span className={`text-xs font-bold ml-auto ${getTradeTotalPnl(t) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {getTradeTotalPnl(t) >= 0 ? '+' : ''}${getTradeTotalPnl(t).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(t.exitTime).toLocaleDateString()}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Notes (optional)</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Any additional rules or reminders..." className="text-sm min-h-16 resize-none" />
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading || !accountLabel || !accountSize}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black font-bold">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</> : 'Add Account'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
