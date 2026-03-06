'use client'

// components/propfirms/AddFirmModal.tsx

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const FIRM_COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b',
  '#ef4444', '#06b6d4', '#ec4899', '#84cc16',
]

const PRESET_FIRMS = [
  { name: 'Apex Trader Funding', short: 'Apex', chip: 'Apex', color: '#3b82f6' },
  { name: 'Take Profit Trader', short: 'TPT', chip: 'TPT', color: '#f59e0b' },
  { name: 'Lucid', short: 'LUC', chip: 'Lucid', color: '#8b5cf6' },
  { name: 'Alpha Futures', short: 'ALPH', chip: 'Alpha', color: '#06b6d4' },
  { name: 'TopStep', short: 'TS', chip: 'TopStep', color: '#10b981' },
  { name: 'My Funded Futures', short: 'MFFU', chip: 'MFFU', color: '#ec4899' },
  { name: 'Tradeify', short: 'TRD', chip: 'Tradeify', color: '#84cc16' },
  { name: 'Custom', short: '', chip: '+ Other', color: '#64748b' },
]

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSaved: () => void
}

export function AddFirmModal({ open, onOpenChange, onSaved }: Props) {
  const [name, setName] = useState('')
  const [shortName, setShortName] = useState('')
  const [color, setColor] = useState(FIRM_COLORS[0])
  const [loading, setLoading] = useState(false)
  const [selectedPresetName, setSelectedPresetName] = useState<string | null>(null)

  function selectPreset(preset: typeof PRESET_FIRMS[0]) {
    setSelectedPresetName(preset.name)
    if (preset.name === 'Custom') {
      setName('')
      setShortName('')
      return
    }
    setName(preset.name)
    setShortName(preset.short)
    setColor(preset.color)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/propfirms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, shortName, logoColor: color }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Failed')
        return
      }
      toast.success(`${name} added!`)
      setName('')
      setShortName('')
      setSelectedPresetName(null)
      onSaved()
    } catch {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Prop Firm</DialogTitle>
          <DialogDescription>Choose a firm or add a custom one</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <Label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Quick Select
            </Label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {PRESET_FIRMS.map(preset => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => selectPreset(preset)}
                  className={cn(
                    'rounded-lg border px-2 py-2 text-center text-xs font-bold transition-all',
                    selectedPresetName === preset.name
                      ? 'border-2 border-emerald-500 bg-emerald-500/10 text-emerald-500'
                      : 'border-border text-muted-foreground hover:border-border/80 hover:text-foreground'
                  )}
                >
                  {preset.chip}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="firm-name">Firm Name</Label>
            <Input
              id="firm-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Apex Trader Funding"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firm-short" className="text-xs">Short Name (2-4 chars)</Label>
              <Input
                id="firm-short"
                value={shortName}
                onChange={e => setShortName(e.target.value)}
                placeholder="e.g. Apex"
                maxLength={4}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Brand Color</Label>
              <div className="flex flex-wrap gap-1.5">
                {FIRM_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      'h-6 w-6 rounded-full border-2 transition-all',
                      color === c ? 'scale-110 border-white' : 'border-transparent'
                    )}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {name && (
            <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-black text-white"
                style={{ background: color }}
              >
                {(shortName || name).slice(0, 2).toUpperCase()}
              </div>
              <span className="text-sm font-bold">{name}</span>
            </div>
          )}

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !name}
              className="flex-1 bg-emerald-500 font-bold text-black hover:bg-emerald-600"
            >
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding...</> : 'Add Firm'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
