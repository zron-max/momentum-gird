import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Loader2, Send, LogOut, Moon, Sun } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

type Severity = 'info' | 'success' | 'error' | 'warning'

const SubscriptionPending: React.FC = () => {
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState<boolean>(() =>
    typeof document !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : false,
  )
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [statusSeverity, setStatusSeverity] = useState<Severity>('info')
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null)

  const navigate = useNavigate()
  const mountedRef = useRef(true)
  const redirectTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (redirectTimeoutRef.current) {
        window.clearTimeout(redirectTimeoutRef.current)
      }
    }
  }, [])

  // Apply theme
  useEffect(() => {
    if (typeof document === 'undefined') return
    if (darkMode) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [darkMode])

  const toggleTheme = () => setDarkMode((s) => !s)

  useEffect(() => {
    const fetchSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) console.error('Error fetching session:', error.message)

      setEmail(session?.user?.email ?? null)
      setLoading(false)
    }

    fetchSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Check approval status every 5s
  useEffect(() => {
    const checkApproval = async () => {
      if (!email) return
      const { data, error } = await supabase
        .from('profiles')
        .select('status')
        .eq('email', email)
        .single()

      if (!error && data?.status === 'approved') {
        navigate('/dashboard')
      }
    }

    const interval = setInterval(checkApproval, 5000)
    return () => clearInterval(interval)
  }, [email, navigate])

  const setStatus = (severity: Severity, message: string) => {
    if (!mountedRef.current) return
    setStatusSeverity(severity)
    setStatusMessage(message)
  }

  const refreshProfile = async () => {
    if (refreshing || !email) return
    setStatusMessage(null)
    setStatusSeverity('info')
    setRefreshing(true)

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('status')
        .eq('email', email)
        .single()

      if (error) {
        console.error('Supabase error fetching profile:', error)
        setStatus(
          'error',
          'Failed to fetch profile. Check your connection or try again later.',
        )
        return
      }

      if (!data) {
        setStatus(
          'warning',
          'Profile not found yet. If you just signed up, wait ~30s and try again.',
        )
        setLastCheckedAt(new Date().toLocaleString())
        return
      }

      setLastCheckedAt(new Date().toLocaleString())

      const statusString = (data.status ?? 'pending').toString()

      if (
        statusString.toLowerCase() === 'approved' ||
        statusString.toLowerCase() === 'active'
      ) {
        setStatus(
          'success',
          'Your account is approved — redirecting to dashboard...',
        )
        redirectTimeoutRef.current = window.setTimeout(() => {
          if (!mountedRef.current) return
          navigate('/dashboard')
        }, 600)
        return
      }

      setStatus(
        'info',
        `Current status: ${statusString}. If you already paid, send proof via Telegram.`,
      )
    } catch (err: any) {
      console.error('Unexpected error refreshing profile:', err)
      setStatus('error', err?.message ?? 'Unexpected error. Try again.')
    } finally {
      if (mountedRef.current) setRefreshing(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Sign out failed:', err)
    } finally {
      navigate('/')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  const statusColor = {
    info: 'text-blue-800 bg-blue-50 dark:bg-blue-900/30',
    success: 'text-green-900 bg-green-50 dark:bg-green-900/30',
    error: 'text-red-900 bg-red-50 dark:bg-red-900/30',
    warning: 'text-yellow-900 bg-yellow-50 dark:bg-yellow-900/30',
  }[statusSeverity]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-10 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <img
              src="logoM.jpg"
              alt="Logo"
              className="w-10 h-10 object-contain"
            />

            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                Subscription Pending
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                We are reviewing your payment. This page will update your
                account <strong className="font-medium">status</strong>.
              </p>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="flex items-center gap-4 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-sm transition text-slate-700 dark:text-slate-300"
          >
            {darkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
            <span className="text-sm">{darkMode ? 'Light' : 'Dark'}</span>
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Account Card */}
          <div className="col-span-1 bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
            <h3 className="text-sm font-medium text-sky-600 mb-2">
              Your Account
            </h3>
            <p className="font-mono text-sm break-words bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded px-3 py-2 text-slate-900 dark:text-white">
              {email || 'No email found'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Use this email when making the payment.
            </p>
          </div>

          {/* Status Card */}
          <div className="col-span-1 md:col-span-2 bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-sky-600">
                  Subscription Status
                </h3>
                <div
                  className={`text-xs font-medium px-3 py-1 rounded-full ${statusColor}`}
                >
                  {statusSeverity.toUpperCase()}
                </div>
              </div>

              <div className="min-h-[68px] flex items-center">
                <div className="flex-1 text-sm text-slate-700 dark:text-slate-200">
                  {statusMessage ? (
                    <div>{statusMessage}</div>
                  ) : (
                    <div className="text-slate-500 dark:text-slate-400">
                      Waiting for approval. You will be redirected once
                      approved.
                    </div>
                  )}
                </div>

                <div className="text-right text-xs text-slate-500 dark:text-slate-400 ml-4">
                  {lastCheckedAt ? (
                    <div className="text-[10px]">Last checked</div>
                  ) : null}
                  <div className="font-mono text-xs">
                    {lastCheckedAt ?? '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
              <Button
                onClick={() =>
                  window.open('https://t.me/ZforZeron', '_blank', 'noopener')
                }
                className="flex-1 w-full sm:w-auto rounded-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-md transform transition duration-150 hover:shadow-lg hover:-translate-y-0.5"
              >
                <Send className="w-5 h-5 mr-2" />
                Send Proof (Telegram)
              </Button>
            </div>
          </div>
        </div>

        {/* Payment Instructions */}
        <div className="bg-gradient-to-t from-white/40 dark:from-transparent border border-slate-100 dark:border-slate-800 rounded-xl p-6 flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">
              How to activate
            </h3>
            <ol className="list-decimal list-inside text-sm space-y-2 text-slate-700 dark:text-slate-200">
              <li>
                <strong>Scan the QR code</strong> to make payment.
              </li>
              <li>
                In payment note write:{' '}
                <span className="font-semibold text-purple-600">
                  Momentum Grid – {email || ''}
                </span>
              </li>
              <li>Take a screenshot of the transaction.</li>
              <li>
                Send the screenshot via{' '}
                <strong className="text-red-500">Telegram</strong> for approval.
              </li>
            </ol>
          </div>

          <div className="w-48 h-48 bg-white dark:bg-slate-900 rounded-lg shadow-md flex items-center justify-center border border-slate-100 dark:border-slate-800">
            <img
              src="artificial_payment_qr.jpg"
              alt="Payment QR"
              className="w-40 h-40 object-cover rounded"
            />
          </div>
        </div>

        {/* Sign Out Button */}
        <div className="mt-6 flex items-center justify-center">
          <button
            onClick={handleSignOut}
            className="text-sm text-rose-500 hover:underline flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out & Try Different Account
          </button>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionPending
