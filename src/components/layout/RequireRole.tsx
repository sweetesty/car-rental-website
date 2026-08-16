import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { EmptyState, Spinner } from '@/components/ui/Misc'
import { LinkButton } from '@/components/ui/Button'
import { useAuth } from '@/lib/hooks'
import type { Role } from '@/lib/types'

/**
 * Gate for dashboard routes. Unauthenticated visitors get bounced to sign-in
 * with a return path; signed-in users with the wrong role see a clear refusal
 * rather than a silent redirect.
 */
export function RequireRole({ roles }: { roles: Role[] }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="grid min-h-[50svh] place-items-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  /*
   * A Google account arrives with no phone number — Google simply doesn't
   * release one. Collect it once, here, rather than discovering it's missing
   * at handover. Admins are exempt: they never appear on a booking.
   */
  if (!user.phone?.trim() && user.role !== 'admin') {
    return <Navigate to="/complete-profile" state={{ from: location.pathname }} replace />
  }

  if (!roles.includes(user.role)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24">
        <EmptyState
          icon={Lock}
          title="You don't have access to this area"
          message={`This dashboard is for ${roles.join(' and ')} accounts. You're signed in as a ${user.role}.`}
          action={<LinkButton to="/">Back to home</LinkButton>}
        />
      </div>
    )
  }

  return <Outlet />
}
