'use client'

// components/library/LibraryClient.tsx

import { useState } from 'react'
import { BookOpen, ExternalLink, X, Star, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

// ── Book data ──────────────────────────────────────────────
const BOOKS = [
  {
    id: 1,
    title: 'Day Trading For Absolute Beginners',
    subtitle: 'From Zero to Your First Trade',
    level: 'Beginner',
    levelColor: 'text-sky-300 bg-sky-500/15 border-sky-400/30',
    accentColor: '#38bdf8',
    accentDim: '#0ea5e940',
    // Matched to the deep navy/blue of the cover
    cardBg: 'linear-gradient(145deg, #0a2540 0%, #0d3560 50%, #0a1f3a 100%)',
    cardBorder: '#1e4d7b',
    coverImage: '/mybooks/day-trading.jpg',
    tags: ['Fundamentals', 'TradingView', 'Paper Trading', 'Prop Firms'],
    kindlePrice: '$2.99',
    paperbackPrice: '$9.99',
    amazon: 'https://www.amazon.com/dp/YOUR_ASIN_1',
    hook: 'The essential starting point — zero jargon, real results.',
    shortDesc: 'A step-by-step blueprint to take you from zero knowledge to confidently placing your very first trade.',
    highlights: [
      'Master the language of candlesticks & timeframes',
      'Discover the "Retail Trap" & institutional liquidity',
      'Complete TradingView setup guide',
      'Place your first trade in a risk-free environment',
      'The 3-step path from demo → prop firm → funded',
    ],
    fullDescription: `Are you ready to learn day trading but have absolutely no idea where to start? "Day Trading for Absolute Beginners" is a simple, step-by-step blueprint designed to take you from zero knowledge to confidently placing your very first trade. Written by professional trader Maor Saadia, this book provides the essential education that most new traders miss, setting you up for a sustainable path in the markets.`,
  },
  {
    id: 2,
    title: 'Smart Money, Simplified',
    subtitle: 'Your Complete ICT Blueprint from Beginner to Consistent Trader',
    level: 'Intermediate',
    levelColor: 'text-red-500 bg-rose-500/15 border-rose-500/30',
    accentColor: '#d33434',
    accentDim: '#bb2b2140',
    // Matched to the dark charcoal/slate of the cover
    cardBg: 'linear-gradient(145deg, #141a1f 0%, #1c2a24 50%, #111820 100%)',
    cardBorder: '#4a302d',
    coverImage: '/mybooks/smart-money.jpg',
    tags: ['ICT', 'Smart Money', 'FVG', 'Order Blocks', 'Risk Management'],
    kindlePrice: '$5.80',
    paperbackPrice: '$12.80',
    amazon: 'https://www.amazon.com/dp/YOUR_ASIN_2',
    hook: 'Stop being the liquidity. Start trading with the institutions.',
    shortDesc: 'The complete ICT & Smart Money Concepts blueprint. Mastery of liquidity, market structure, FVGs, Order Blocks, and a professional-grade trading plan.',
    highlights: [
      'Spot liquidity grabs, stop hunts & the Judas Swing',
      'Master BOS & CHOCH for market narrative',
      'High-probability FVG & Order Block entry models',
      'Complete professional trading plan checklist',
      'BONUS: Full strategy to pass prop firm challenges',
    ],
    fullDescription: `"Smart Money, Simplified" is a complete, all-in-one ICT & Smart Money Concepts blueprint designed to transform you from a frustrated retail trader into a calm, confident, and consistently profitable professional. Filled with annotated charts and clear examples, this book pulls back the curtain on how financial markets truly work.`,
  },
  {
    id: 3,
    title: 'THE ICT PLAYBOOK',
    subtitle: 'Mastering the Advanced ICT Models for Funded Trading',
    level: 'Advanced',
    levelColor: 'text-zinc-300 bg-zinc-500/15 border-zinc-400/30',
    accentColor: '#a1a1aa',
    accentDim: '#71717a40',
    // Matched to the brushed silver/metallic of the cover
    cardBg: 'linear-gradient(145deg, #1a1a1c 0%, #252528 50%, #1a1a1c 100%)',
    cardBorder: '#3f3f46',
    coverImage: '/mybooks/the-ict-playbook.jpg',
    tags: ['Silver Bullet', 'PO3', 'SMT Divergence', 'IPDA', 'Breaker Blocks'],
    kindlePrice: '$6.80',
    paperbackPrice: '$13.80',
    amazon: 'https://www.amazon.com/dp/YOUR_ASIN_3',
    hook: 'The sequel to Smart Money, Simplified. Surgical precision for funded trading.',
    shortDesc: 'Deep dive into the specific rule-based models that professional traders use — Power of Three, Silver Bullet, SMT Divergence, IPDA, and advanced Breaker & Mitigation Blocks.',
    highlights: [
      'Power of Three (PO3) & the Judas Swing decoded',
      'ICT 2022 Silver Bullet — step-by-step execution',
      'Breaker vs Mitigation Blocks — finally clarified',
      'SMT Divergence: the market\'s lie detector',
      'BONUS: Funded trader mindset & 0.5% risk rule',
    ],
    fullDescription: `"THE ICT PLAYBOOK" is the definitive sequel to Smart Money, Simplified. It is not a review of fundamentals; it is a deep dive into the specific, rule-based models that professional traders use to engineer entries with surgical precision.`,
  },
  {
    id: 4,
    title: 'The Modern ICT Trader\'s Masterclass',
    subtitle: 'The 3-in-1 Path from A-Z to Day Trading Mastery',
    level: 'Complete Series',
    levelColor: 'text-amber-300 bg-amber-500/15 border-amber-400/30',
    accentColor: '#fbbf24',
    accentDim: '#f59e0b40',
    // Matched to the cream/warm white of the cover
    cardBg: 'linear-gradient(145deg, #1c1a12 0%, #2a2516 50%, #1c1a12 100%)',
    cardBorder: '#4a3f1a',
    coverImage: '/mybooks/the-modern-ict.jpg',
    tags: ['Complete Guide', 'Beginner to Pro', 'All 3 Books', 'Best Value'],
    kindlePrice: '$9.99',
    paperbackPrice: '$19.99',
    amazon: 'https://www.amazon.com/dp/YOUR_ASIN_4',
    hook: 'All three books in one. The only trading education you\'ll ever need.',
    shortDesc: 'A complete 3-in-1 masterclass integrating the entire day trading series — from absolute beginner to funded professional — in one seamless A-to-Z journey.',
    highlights: [
      'Book 1: Rock-solid foundation from zero',
      'Book 2: Complete SMC & ICT blueprint',
      'Book 3: Advanced models for funded trading',
      'Daily Execution Checklist included',
      'Iron-clad risk management & psychology chapters',
    ],
    fullDescription: `The Modern ICT Trader's Masterclass is a complete 3-in-1 volume, integrating the author's entire day trading series into one comprehensive, A-to-Z path to day trading mastery. This isn't just a collection of books; it's a seamless educational journey designed to take you from knowing nothing to trading with the precision of an institutional professional.`,
    featured: true,
  },
  {
    id: 5,
    title: 'THE INSTITUTIONAL ICT CODEX',
    subtitle: 'The Definitive Guide to Smart Money Concepts for Forex, Futures & Indices',
    level: 'Expert',
    levelColor: 'text-blue-300 bg-blue-500/15 border-blue-400/30',
    accentColor: '#60a5fa',
    accentDim: '#3b82f640',
    // Matched to the off-white/blueprint paper of the cover
    cardBg: 'linear-gradient(145deg, #0f1624 0%, #162036 50%, #0f1624 100%)',
    cardBorder: '#1e3a5f',
    coverImage: '/mybooks/the-institutinnal-ict.jpg',
    tags: ['IPDA', 'Textbook', 'MSS', 'Kill Zones', 'Execution Models'],
    kindlePrice: '$7.90',
    paperbackPrice: '$17.90',
    kindleUnlimited: true,
    amazon: 'https://www.amazon.com/dp/YOUR_ASIN_5',
    hook: 'The textbook. Every concept, unified into one structured curriculum.',
    shortDesc: 'A comprehensive structured textbook decoding the IPDA language. Covers MSS, Order Blocks, FVGs, Kill Zones, Silver Bullet, Unicorn Setup, and risk protocols.',
    highlights: [
      'Complete IPDA language — read charts institutionally',
      'Surgical Order Block & FVG identification',
      'Kill Zone timing — never miss the algorithm\'s move',
      'Silver Bullet & Unicorn Setup checklists',
      'Prop firm risk & psychology frameworks',
    ],
    fullDescription: `THE INSTITUTIONAL ICT CODEX is not just another strategy guide. It is a comprehensive, structured textbook designed to decode the language of the Interbank Price Delivery Algorithm (IPDA). Author Maor Saadia has unified the vast, complex world of Smart Money Concepts and ICT methodology into a singular, logical curriculum.`,
  },
  {
    id: 6,
    title: 'The Disciplined Edge',
    subtitle: 'Mastering the Mental Game of Institutional Trading',
    level: 'Psychology',
    levelColor: 'text-emerald-300 bg-emerald-500/15 border-emerald-400/30',
    accentColor: '#4ade80',
    accentDim: '#22c55e40',
    // Matched to the clean white/light grey of the cover
    cardBg: 'linear-gradient(145deg, #0f1a12 0%, #162218 50%, #0f1a12 100%)',
    cardBorder: '#1e4028',
    coverImage: '/mybooks/the-disciplined-edge.jpg',
    tags: ['Psychology', 'Discipline', 'Prop Firm Mindset', 'Risk Management'],
    kindlePrice: '$4.99',
    paperbackPrice: '$11.99',
    kindleUnlimited: true,
    amazon: 'https://www.amazon.com/dp/YOUR_ASIN_6',
    hook: 'You know the strategy. So why are you still losing?',
    shortDesc: 'A tactical manual combining neuroscience, probability math, and institutional wisdom. Transform from an impulsive trader into a cold, calculated risk manager.',
    highlights: [
      'The Biological Hijack — override the amygdala',
      'Shatter the "Invisible Wall" blocking your profits',
      'Pass evaluations with Preservation Mode mindset',
      'The Probability Shield — trade like a casino',
      'The Legacy Protocol — eliminate decision fatigue',
    ],
    fullDescription: `In The Disciplined Edge, Maor Saadia strips away the noise of the retail trading industry to reveal the uncomfortable truth: The market is not a game of prediction; it is a game of psychological warfare. This is not a book of "positive affirmations." It is a tactical manual combining neuroscience, probability mathematics, and hard-won institutional wisdom.`,
  },
]

// ── Book Cover ─────────────────────────────────────────────
function BookCover({ book, size = 'md' }: { book: typeof BOOKS[0]; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const dims = {
    sm: 'w-[96px] h-[138px]',
    md: 'w-[132px] h-[192px]',
    lg: 'w-[170px] h-[246px]',
    xl: 'w-[200px] h-[290px]',
  }
  const imageSizes = {
    sm: '96px',
    md: '132px',
    lg: '170px',
    xl: '200px',
  }
  return (
    <div className={cn(dims[size], 'rounded-xl overflow-hidden shrink-0 relative')}
      style={{
        boxShadow: `0 25px 50px -10px ${book.accentColor}35, 0 0 0 1px ${book.accentColor}20`,
      }}>
      <Image src={book.coverImage} alt={book.title} fill sizes={imageSizes[size]} className="object-cover" />
    </div>
  )
}

// ── Level Badge ────────────────────────────────────────────
function LevelBadge({ book }: { book: typeof BOOKS[0] }) {
  return (
    <span className={cn('inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full border tracking-wide', book.levelColor)}>
      {book.level}
    </span>
  )
}

// ── Book Detail Modal ──────────────────────────────────────
function BookModal({ book, onClose }: { book: typeof BOOKS[0]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
      <div
        className="relative w-full sm:max-w-xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl border border-border bg-card dark:border-transparent dark:bg-transparent"
        style={{
          boxShadow: `0 -20px 80px -10px ${book.accentColor}25`,
        }}
        onClick={e => e.stopPropagation()}>
        <div
          className="absolute inset-0 hidden dark:block rounded-t-3xl sm:rounded-2xl pointer-events-none"
          style={{
            background: book.cardBg,
            border: `1px solid ${book.cardBorder}`,
          }}
        />

        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30 dark:bg-white/20" />
        </div>

        {/* Top glow line */}
        <div className="relative h-px mx-6 mt-1 sm:mt-0 rounded-full" style={{ background: `linear-gradient(90deg, transparent, ${book.accentColor}80, transparent)` }} />

        <div className="relative p-6 space-y-5">
          {/* Header row */}
          <div className="flex items-start gap-5">
            <BookCover book={book} size="lg" />
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-start justify-between gap-2">
                <LevelBadge book={book} />
                <button onClick={onClose}
                  className="w-8 h-8 rounded-full bg-muted border border-border dark:bg-white/5 dark:border-white/10 flex items-center justify-center hover:bg-muted/80 dark:hover:bg-white/10 transition-colors shrink-0">
                  <X className="w-3.5 h-3.5 text-muted-foreground dark:text-white/60" />
                </button>
              </div>
              <h2 className="text-base font-black mt-3 leading-tight text-foreground dark:text-white">{book.title}</h2>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: `${book.accentColor}aa` }}>{book.subtitle}</p>
              <p className="text-xs mt-3 italic text-muted-foreground dark:text-white/50 leading-relaxed">&ldquo;{book.hook}&rdquo;</p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border dark:bg-white/5" />

          {/* Description */}
          <p className="text-xs text-muted-foreground dark:text-white/60 leading-relaxed">{book.fullDescription}</p>

          {/* What you'll learn */}
          <div className="rounded-xl p-4 space-y-3" style={{ background: `${book.accentColor}08`, border: `1px solid ${book.accentColor}20` }}>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: book.accentColor }}>What You&apos;ll Learn</p>
            {book.highlights.map((h, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: `${book.accentColor}20`, border: `1px solid ${book.accentColor}40` }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: book.accentColor }} />
                </div>
                <p className="text-xs text-foreground dark:text-white/80">{h}</p>
              </div>
            ))}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {book.tags.map(tag => (
              <span key={tag} className="text-[10px] px-2.5 py-1 rounded-full font-medium"
                style={{ background: `${book.accentColor}10`, color: `${book.accentColor}cc`, border: `1px solid ${book.accentColor}20` }}>
                {tag}
              </span>
            ))}
          </div>

          {/* CTA section */}
          <div className="rounded-2xl p-4 space-y-3 border border-border bg-muted/30 dark:bg-white/5 dark:border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground dark:text-white/40 mb-0.5">Kindle</p>
                <p className="text-lg font-black" style={{ color: book.accentColor }}>
                  {book.kindlePrice}
                </p>
                {book.kindleUnlimited && (
                  <p className="text-[10px] text-emerald-500 mt-0.5">Free with Kindle Unlimited</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground dark:text-white/40 mb-0.5">Paperback</p>
                <p className="text-sm font-bold text-foreground/80 dark:text-white/70">{book.paperbackPrice}</p>
              </div>
            </div>
            <a href={book.amazon} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl text-sm font-black text-black transition-all hover:opacity-90 active:scale-[0.98] cursor-pointer"
              style={{ background: `linear-gradient(135deg, ${book.accentColor}, ${book.accentColor}cc)` }}>
              <ExternalLink className="w-4 h-4" />
              Get on Amazon
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Featured Book ──────────────────────────────────────────
function FeaturedBook({ book, onOpen }: { book: typeof BOOKS[0]; onOpen: () => void }) {
  return (
    <div className="relative rounded-2xl overflow-hidden cursor-pointer group"
      style={{ boxShadow: `0 0 60px -15px ${book.accentColor}30` }}
      onClick={onOpen}>
      <div className="absolute inset-0 bg-card border border-border dark:hidden" />
      <div
        className="absolute inset-0 hidden dark:block pointer-events-none"
        style={{
          background: book.cardBg,
          border: `1px solid ${book.cardBorder}`,
        }}
      />

      {/* Animated top shimmer */}
      <div className="absolute top-0 inset-x-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent 0%, ${book.accentColor}80 40%, ${book.accentColor} 50%, ${book.accentColor}80 60%, transparent 100%)` }} />

      {/* Background glow blob */}
      <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: book.accentColor }} />

      <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-6">
        <div className="shrink-0 mx-auto sm:mx-0">
          <BookCover book={book} size="xl" />
        </div>

        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <LevelBadge book={book} />
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: `${book.accentColor}20`, color: book.accentColor, border: `1px solid ${book.accentColor}40` }}>
              <Star className="w-2.5 h-2.5 fill-current" />
              Best Value
            </span>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-black leading-tight text-foreground dark:text-white">{book.title}</h3>
            <p className="text-sm mt-1" style={{ color: `${book.accentColor}99` }}>{book.subtitle}</p>
          </div>

          <p className="text-sm italic text-muted-foreground dark:text-white/50 leading-relaxed border-l-2 pl-3" style={{ borderColor: `${book.accentColor}50` }}>
            &ldquo;{book.hook}&rdquo;
          </p>

          <p className="text-xs text-muted-foreground dark:text-white/60 leading-relaxed">{book.shortDesc}</p>

          <div className="flex flex-wrap gap-1.5">
            {book.tags.map(tag => (
              <span key={tag} className="text-[10px] px-2.5 py-1 rounded-full font-medium"
                style={{ background: `${book.accentColor}10`, color: `${book.accentColor}aa`, border: `1px solid ${book.accentColor}20` }}>
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-4 pt-1">
            <div>
              <p className="text-xs text-muted-foreground dark:text-white/40">Kindle</p>
              <p className="text-2xl font-black" style={{ color: book.accentColor }}>{book.kindlePrice}</p>
              {book.kindleUnlimited && (
                <p className="text-[10px] text-emerald-500 mt-0.5">Free with Kindle Unlimited</p>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground dark:text-white/40">Paperback</p>
              <p className="text-base font-bold text-foreground/80 dark:text-white/60">{book.paperbackPrice}</p>
            </div>
            <button
              onClick={e => { e.stopPropagation(); window.open(book.amazon, '_blank') }}
              className="ml-auto flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-black text-black transition-all hover:opacity-90 active:scale-95 shrink-0 cursor-pointer"
              style={{ background: `linear-gradient(135deg, ${book.accentColor}, ${book.accentColor}cc)` }}>
              <ExternalLink className="w-4 h-4" />
              Amazon
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Regular Book Card ──────────────────────────────────────
function BookCard({ book, onOpen }: { book: typeof BOOKS[0]; onOpen: () => void }) {
  return (
    <div onClick={onOpen}
      className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 border border-border dark:border-transparent bg-card dark:bg-transparent"
      style={{
        boxShadow: `0 4px 24px -8px ${book.accentColor}20`,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 40px -8px ${book.accentColor}40, 0 0 0 1px ${book.cardBorder}`
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 24px -8px ${book.accentColor}20`
      }}>
      <div
        className="absolute inset-0 hidden dark:block pointer-events-none"
        style={{
          background: book.cardBg,
          border: `1px solid ${book.cardBorder}`,
        }}
      />

      {/* Top accent shimmer */}
      <div className="absolute top-0 inset-x-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${book.accentColor}80, transparent)` }} />

      {/* Glow blob */}
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none"
        style={{ background: book.accentColor }} />

      <div className="relative p-4 flex gap-4">
        <BookCover book={book} size="sm" />

        <div className="flex-1 min-w-0 space-y-2.5 py-0.5">
          <LevelBadge book={book} />

          <div>
            <h3 className="text-sm font-black leading-snug text-foreground dark:text-white line-clamp-2">{book.title}</h3>
            <p className="text-[11px] mt-0.5" style={{ color: `${book.accentColor}80` }}>{book.subtitle}</p>
          </div>

          <p className="text-[11px] italic text-muted-foreground dark:text-white/40 line-clamp-2 leading-relaxed">&ldquo;{book.hook}&rdquo;</p>

          <div className="flex items-end justify-between gap-2 pt-0.5">
            <div>
              <p className="text-xs font-black" style={{ color: book.accentColor }}>
                {book.kindlePrice}
                <span className="text-[10px] font-normal text-muted-foreground dark:text-white/30 ml-1">Kindle</span>
              </p>
              {book.kindleUnlimited && (
                <p className="text-[10px] text-emerald-500 mt-0.5">Free with Kindle Unlimited</p>
              )}
              <p className="text-[10px] text-muted-foreground dark:text-white/35 mt-0.5">Paperback {book.paperbackPrice}</p>
            </div>
            <button
              onClick={e => { e.stopPropagation(); window.open(book.amazon, '_blank') }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black text-black transition-all hover:opacity-90 shrink-0 cursor-pointer"
              style={{ background: book.accentColor }}>
              Amazon
              <ExternalLink className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────
export function LibraryClient() {
  const [selectedBook, setSelectedBook] = useState<typeof BOOKS[0] | null>(null)
  const [filter, setFilter] = useState<string>('All')

  const featured = BOOKS.find(b => b.featured)
  const others = BOOKS.filter(b => !b.featured)

  const levels = ['All', 'Beginner', 'Intermediate', 'Advanced', 'Expert', 'Psychology', 'Complete Series']
  const filtered = filter === 'All' ? others : others.filter(b => b.level === filter)

  return (
    <div className="min-h-screen bg-background">
      <div className="p-5 sm:p-8 max-w-4xl mx-auto space-y-8">

        {/* ── Header ── */}
        <div className="space-y-1 pt-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Trading Library</h1>
          </div>
          <p className="text-sm text-muted-foreground pl-10">
            Books by <span className="font-semibold text-foreground">Maor Saadia</span> — beginner to institutional-grade funded trader
          </p>
        </div>

        {/* ── Author Banner ── */}
        <div className="rounded-2xl overflow-hidden border border-emerald-500/15 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-[#0d1f15] dark:to-[#0f2218] dark:border-white/5">
          <div className="px-5 py-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0 font-black text-black text-sm shadow-lg shadow-emerald-500/30">
              MS
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground dark:text-white">Maor Saadia — Founder of MSFunded</p>
              <p className="text-xs text-muted-foreground dark:text-white/40 mt-0.5">Professional futures trader · ICT & Smart Money Concepts · These books are the exact curriculum behind this platform.</p>
            </div>
            <div className="shrink-0 text-right hidden sm:block">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">6 Books</p>
              <p className="text-xs font-bold text-emerald-400 mt-0.5">All on Amazon</p>
            </div>
          </div>
        </div>

        {/* ── Featured ── */}
        {featured && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Featured · Complete Series</p>
            </div>
            <FeaturedBook book={featured} onOpen={() => setSelectedBook(featured)} />
          </div>
        )}

        {/* ── Filter Tabs ── */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">All Books</p>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {levels.map(level => (
              <button key={level}
                onClick={() => setFilter(level)}
                className={cn(
                  'shrink-0 text-[10px] font-bold px-3.5 py-1.5 rounded-lg border transition-all',
                  filter === level
                    ? 'bg-emerald-500 text-black border-emerald-500 shadow-lg shadow-emerald-500/30'
                    : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/20'
                )}>
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* ── Books Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(book => (
            <BookCard key={book.id} book={book} onOpen={() => setSelectedBook(book)} />
          ))}
        </div>

        {/* ── Bottom Tip ── */}
        <div className="rounded-2xl border border-border px-5 py-4 text-center bg-muted/20">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="text-foreground font-semibold">💡 Recommended path:</span>{' '}
            Start with <em className="text-foreground/80">Day Trading for Beginners</em>, advance to{' '}
            <em className="text-foreground/80">Smart Money, Simplified</em>, then master{' '}
            <em className="text-foreground/80">The ICT Playbook</em>. Or grab the{' '}
            <em className="text-amber-500 dark:text-amber-400/80">Masterclass</em> for all three at once.
          </p>
        </div>

      </div>

      {/* ── Modal ── */}
      {selectedBook && (
        <BookModal book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </div>
  )
}
