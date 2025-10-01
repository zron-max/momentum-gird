// pages/api/admin/deleteUser.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // must be SERVICE ROLE
)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId, profileId } = req.body

  try {
    // 1. Delete user from auth
    const { error: authError } =
      await supabaseAdmin.auth.admin.deleteUser(userId)
    if (authError) throw authError

    // 2. Delete from profiles table
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', profileId)
    if (profileError) throw profileError

    return res.status(200).json({ success: true })
  } catch (err: any) {
    return res
      .status(500)
      .json({ error: err.message || 'Failed to delete user' })
  }
}
