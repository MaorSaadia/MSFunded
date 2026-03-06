import propfirmData from '@/lib/propfirm.json'

type AnyRecord = Record<string, unknown>

const FUNDED_VARIANT_KEYS = [
  'pro',
  'pro_plus',
  'express_funded_standard',
  'express_funded_consistency',
  'live_funded',
  'phase_variants',
] as const

export interface FundedRulesConfig {
  source?: {
    firmKey?: string
    programKey?: string
    accountSizeUsd?: number
    fundedVariant?: string
  }
  payout?: {
    minTradeDays?: number
    minDailyProfitUsd?: number
    minBalanceToRequestUsd?: number
    minPayoutUsd?: number
    maxConsistencyPercent?: number
    profitSplitPercent?: number
    frequency?: string
    notes?: string[]
  }
  meta?: {
    hasVerifyMarkers?: boolean
    rawFunded?: unknown
  }
}

export interface FundedPresetVariant {
  key: string
  label: string
}

export interface FundedPresetAccountSize {
  accountSizeUsd: number
  variants: FundedPresetVariant[]
}

export interface FundedPresetProgram {
  programKey: string
  programName: string
  accountSizes: FundedPresetAccountSize[]
}

export interface FundedPresetFirm {
  firmKey: string
  firmName: string
  programs: FundedPresetProgram[]
}

export function toFundedRulesConfig(value: unknown): FundedRulesConfig | null {
  if (!value || Array.isArray(value) || typeof value !== 'object') return null
  const record = value as AnyRecord
  const payout = record.payout
  if (!payout || typeof payout !== 'object') return null
  return record as FundedRulesConfig
}

function titleize(raw: string) {
  return raw
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

function getObject(value: unknown): AnyRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as AnyRecord
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    if (value.includes('[VERIFY]')) return undefined
    const cleaned = value.replace(/[$,\s]/g, '')
    if (!cleaned) return undefined
    const parsed = Number(cleaned)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

function getByPath(obj: AnyRecord | null, path: string): unknown {
  if (!obj) return undefined
  return path.split('.').reduce<unknown>((acc, key) => {
    if (!acc || typeof acc !== 'object' || Array.isArray(acc)) return undefined
    return (acc as AnyRecord)[key]
  }, obj)
}

function firstNumeric(sources: AnyRecord[], paths: string[]): number | undefined {
  for (const path of paths) {
    for (const source of sources) {
      const candidate = toNumber(getByPath(source, path))
      if (candidate != null) return candidate
    }
  }
  return undefined
}

function firstString(sources: AnyRecord[], paths: string[]): string | undefined {
  for (const path of paths) {
    for (const source of sources) {
      const candidate = getByPath(source, path)
      if (typeof candidate === 'string' && candidate.trim()) return candidate.trim()
    }
  }
  return undefined
}

function hasVerifyMarker(value: unknown): boolean {
  if (value == null) return false
  if (typeof value === 'string') return value.includes('[VERIFY]')
  if (Array.isArray(value)) return value.some(hasVerifyMarker)
  if (typeof value === 'object') return Object.values(value as AnyRecord).some(hasVerifyMarker)
  return false
}

function collectNotes(...sources: AnyRecord[]): string[] {
  const notes = new Set<string>()
  for (const source of sources) {
    const payout = getObject(source.payout_rules)
    if (!payout) continue
    const details = payout.details
    if (typeof details === 'string' && details.trim()) notes.add(details.trim())
    const policy = payout.policy
    if (typeof policy === 'string' && policy.trim()) notes.add(`Policy: ${policy.trim()}`)
  }
  return [...notes]
}

export function getFundedPresetCatalog(): FundedPresetFirm[] {
  const firms = (propfirmData as { firms?: unknown[] }).firms ?? []
  const result: FundedPresetFirm[] = []

  for (const rawFirm of firms) {
    const firm = getObject(rawFirm)
    if (!firm) continue
    const firmName = typeof firm.firm_name === 'string' ? firm.firm_name : ''
    const firmKey = typeof firm.firm_key === 'string' ? firm.firm_key : ''
    const rawPrograms = Array.isArray(firm.programs) ? firm.programs : []
    const programs: FundedPresetProgram[] = []

    for (const rawProgram of rawPrograms) {
      const program = getObject(rawProgram)
      if (!program) continue
      const rawSizes = Array.isArray(program.account_sizes) ? program.account_sizes : []
      const accountSizes: FundedPresetAccountSize[] = []

      for (const rawSize of rawSizes) {
        const size = getObject(rawSize)
        const funded = size ? getObject(size.funded) : null
        if (!size || !funded) continue

        const accountSizeUsd = toNumber(size.account_size_usd)
        if (!accountSizeUsd) continue

        const variants: FundedPresetVariant[] = []
        for (const key of FUNDED_VARIANT_KEYS) {
          if (!(key in funded)) continue
          if (key === 'phase_variants') {
            const phaseVariants = getObject(funded.phase_variants)
            if (!phaseVariants) continue
            for (const variantKey of Object.keys(phaseVariants)) {
              variants.push({ key: variantKey, label: titleize(variantKey) })
            }
            continue
          }
          variants.push({ key, label: titleize(key) })
        }

        accountSizes.push({ accountSizeUsd, variants })
      }

      if (accountSizes.length === 0) continue
      programs.push({
        programKey: typeof program.program_key === 'string' ? program.program_key : '',
        programName: typeof program.program_name === 'string' ? program.program_name : '',
        accountSizes,
      })
    }

    if (programs.length === 0) continue
    result.push({ firmKey, firmName, programs })
  }

  return result
}

export function findFundedFirmKeyByName(name: string | null | undefined): string | undefined {
  if (!name) return undefined
  const normalized = name.trim().toLowerCase()
  if (!normalized) return undefined
  const catalog = getFundedPresetCatalog()
  const exact = catalog.find(f => f.firmName.toLowerCase() === normalized)
  if (exact) return exact.firmKey
  const contains = catalog.find(f =>
    f.firmName.toLowerCase().includes(normalized) || normalized.includes(f.firmName.toLowerCase())
  )
  return contains?.firmKey
}

interface BuildInput {
  firmKey: string
  programKey: string
  accountSizeUsd: number
  fundedVariant?: string
}

export function buildFundedRulesConfig(input: BuildInput): FundedRulesConfig | null {
  const firms = (propfirmData as { firms?: unknown[] }).firms ?? []
  const firm = firms
    .map(getObject)
    .find(f => f && f.firm_key === input.firmKey)
  if (!firm) return null

  const program = (Array.isArray(firm.programs) ? firm.programs : [])
    .map(getObject)
    .find(p => p && p.program_key === input.programKey)
  if (!program) return null

  const size = (Array.isArray(program.account_sizes) ? program.account_sizes : [])
    .map(getObject)
    .find(s => s && toNumber(s.account_size_usd) === input.accountSizeUsd)
  if (!size) return null

  const funded = getObject(size.funded)
  if (!funded) return null

  let selectedFunded = funded
  if (input.fundedVariant) {
    const phaseVariants = getObject(funded.phase_variants)
    if (phaseVariants && getObject(phaseVariants[input.fundedVariant])) {
      selectedFunded = getObject(phaseVariants[input.fundedVariant]) ?? funded
    } else if (getObject(funded[input.fundedVariant])) {
      selectedFunded = getObject(funded[input.fundedVariant]) ?? funded
    }
  }

  const sources = [selectedFunded, funded].filter(Boolean) as AnyRecord[]
  const notes = collectNotes(selectedFunded, funded)

  const payout: FundedRulesConfig['payout'] = {
    minTradeDays: firstNumeric(sources, [
      'payout_rules.min_trade_days',
      'payout_rules.min_profit_days',
      'payout_rules.min_days',
      'payout_rules.qualify_after.winning_days_required',
      'payout_rules.min_profitable_days_per_payout',
    ]),
    minDailyProfitUsd: firstNumeric(sources, [
      'payout_rules.min_daily_profit_usd',
      'payout_rules.min_profit_per_day_usd',
      'payout_rules.qualify_after.min_net_pnl_per_day_usd',
    ]),
    minBalanceToRequestUsd: firstNumeric(sources, [
      'payout_rules.min_balance_to_request_usd',
      'payout_rules.buffer_balance_usd',
    ]),
    minPayoutUsd: firstNumeric(sources, [
      'payout_rules.min_payout_usd',
      'payout_rules.withdrawal_limit.min_payout_usd',
    ]),
    profitSplitPercent: firstNumeric(sources, [
      'profit_split_percent_to_trader',
      'payout_rules.profit_split_percent_to_trader',
      'payout_rules.profit_split',
    ]),
    frequency: firstString(sources, [
      'payout_rules.frequency',
      'payout_rules.payout_frequency',
      'payout_rules.payout_window',
    ]),
    notes: notes.length > 0 ? notes : undefined,
  }

  return {
    source: {
      firmKey: input.firmKey,
      programKey: input.programKey,
      accountSizeUsd: input.accountSizeUsd,
      fundedVariant: input.fundedVariant,
    },
    payout,
    meta: {
      hasVerifyMarkers: hasVerifyMarker(selectedFunded) || hasVerifyMarker(funded),
      rawFunded: selectedFunded,
    },
  }
}
