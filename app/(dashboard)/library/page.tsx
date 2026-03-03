// app/(dashboard)/library/page.tsx

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { LibraryClient } from '@/components/library/LibraryClient'

export const metadata = { title: 'Trading Library — MSFunded' }

export default async function LibraryPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  return <LibraryClient />
}