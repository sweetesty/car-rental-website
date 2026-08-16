import { Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { RequireRole } from '@/components/layout/RequireRole'
import { ErrorBoundary } from '@/components/layout/ErrorBoundary'
import { Spinner } from '@/components/ui/Misc'
import { lazyPage } from '@/lib/lazyPage'
import { ThemeProvider } from '@/context/ThemeContext'
import { AuthProvider } from '@/context/AuthContext'
import { DataProvider } from '@/context/DataContext'
import { FavoritesProvider } from '@/context/FavoritesContext'
import { ToastProvider } from '@/context/ToastContext'
import Home from '@/pages/Home'

/* Everything past the landing page is split out — the homepage ships alone. */
const Cars = lazyPage(() => import('@/pages/Cars'))
const CarDetails = lazyPage(() => import('@/pages/CarDetails'))
const Compare = lazyPage(() => import('@/pages/Compare'))
const Favorites = lazyPage(() => import('@/pages/Favorites'))
const Booking = lazyPage(() => import('@/pages/Booking'))
const BookingConfirmed = lazyPage(() => import('@/pages/BookingConfirmed'))
const HowItWorks = lazyPage(() => import('@/pages/HowItWorks'))
const WhyAutogo = lazyPage(() => import('@/pages/WhyAutogo'))
const BecomeAHost = lazyPage(() => import('@/pages/BecomeAHost'))
const NotFound = lazyPage(() => import('@/pages/NotFound'))
const Login = lazyPage(() => import('@/pages/Login'))
const Register = lazyPage(() => import('@/pages/Register'))
const CompleteProfile = lazyPage(() => import('@/pages/CompleteProfile'))
const ForgotPassword = lazyPage(() => import('@/pages/ForgotPassword'))
const AuthAction = lazyPage(() => import('@/pages/AuthAction'))

const TrustAndSafety = lazyPage(() =>
  import('@/pages/Content').then((m) => ({ default: m.TrustAndSafety })),
)
const Support = lazyPage(() => import('@/pages/Content').then((m) => ({ default: m.Support })))
const Terms = lazyPage(() => import('@/pages/Content').then((m) => ({ default: m.Terms })))
const Privacy = lazyPage(() => import('@/pages/Content').then((m) => ({ default: m.Privacy })))

const MyBookings = lazyPage(() => import('@/pages/dashboard/MyBookings'))
const MyReviews = lazyPage(() => import('@/pages/dashboard/MyReviews'))
const MyPayments = lazyPage(() => import('@/pages/dashboard/MyPayments'))
const Profile = lazyPage(() => import('@/pages/dashboard/Profile'))

const OwnerOverview = lazyPage(() => import('@/pages/dashboard/OwnerOverview'))
const OwnerCars = lazyPage(() => import('@/pages/dashboard/OwnerCars'))
const CarForm = lazyPage(() => import('@/pages/dashboard/CarForm'))
const OwnerBookings = lazyPage(() => import('@/pages/dashboard/OwnerBookings'))
const OwnerCalendar = lazyPage(() => import('@/pages/dashboard/OwnerCalendar'))
const OwnerEarnings = lazyPage(() => import('@/pages/dashboard/OwnerEarnings'))

const AdminAnalytics = lazyPage(() => import('@/pages/dashboard/AdminAnalytics'))
const AdminCars = lazyPage(() => import('@/pages/dashboard/AdminCars'))
const AdminUsers = lazyPage(() => import('@/pages/dashboard/AdminUsers'))
const AdminBookings = lazyPage(() => import('@/pages/dashboard/AdminBookings'))
const AdminPayments = lazyPage(() => import('@/pages/dashboard/AdminPayments'))

const PageFallback = () => (
  <div className="grid min-h-[60svh] place-items-center">
    <Spinner className="size-8" />
  </div>
)

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <DataProvider>
            <FavoritesProvider>
              <BrowserRouter>
                {/* Inside the router so it can re-key on the pathname, and
                    outside Suspense so a chunk that fails twice surfaces here
                    rather than hanging on the spinner forever. */}
                <ErrorBoundary>
                <Suspense fallback={<PageFallback />}>
                  <Routes>
                    {/* Auth screens use their own full-bleed shell. */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    {/* Where Firebase's emailed links land once the action URL
                        is customised. Must stay at this exact path — it is
                        configured in the Firebase console, not here. */}
                    <Route path="/auth/action" element={<AuthAction />} />
                    {/* Deliberately outside RequireRole — that guard is what
                        redirects here, so gating it would loop. */}
                    <Route path="/complete-profile" element={<CompleteProfile />} />

                    <Route element={<Layout />}>
                      <Route index element={<Home />} />
                      <Route path="cars" element={<Cars />} />
                      <Route path="cars/:id" element={<CarDetails />} />
                      <Route path="compare" element={<Compare />} />
                      <Route path="favorites" element={<Favorites />} />
                      <Route path="how-it-works" element={<HowItWorks />} />
                      <Route path="why-autogo" element={<WhyAutogo />} />
                      <Route path="become-a-host" element={<BecomeAHost />} />
                      <Route path="trust-and-safety" element={<TrustAndSafety />} />
                      <Route path="support" element={<Support />} />
                      <Route path="terms" element={<Terms />} />
                      <Route path="privacy" element={<Privacy />} />

                      <Route element={<RequireRole roles={['customer', 'owner', 'admin']} />}>
                        <Route path="book/:carId" element={<Booking />} />
                        <Route path="bookings/:id/confirmed" element={<BookingConfirmed />} />
                      </Route>

                      <Route path="*" element={<NotFound />} />
                    </Route>

                    <Route element={<RequireRole roles={['customer', 'owner', 'admin']} />}>
                      <Route path="/account" element={<DashboardLayout />}>
                        <Route index element={<MyBookings />} />
                        <Route path="reviews" element={<MyReviews />} />
                        <Route path="payments" element={<MyPayments />} />
                        <Route path="profile" element={<Profile />} />
                      </Route>
                    </Route>

                    <Route element={<RequireRole roles={['owner']} />}>
                      <Route path="/owner" element={<DashboardLayout />}>
                        <Route index element={<OwnerOverview />} />
                        <Route path="cars" element={<OwnerCars />} />
                        <Route path="cars/new" element={<CarForm />} />
                        <Route path="cars/:id/edit" element={<CarForm />} />
                        <Route path="bookings" element={<OwnerBookings />} />
                        <Route path="calendar" element={<OwnerCalendar />} />
                        <Route path="earnings" element={<OwnerEarnings />} />
                      </Route>
                    </Route>

                    <Route element={<RequireRole roles={['admin']} />}>
                      <Route path="/admin" element={<DashboardLayout />}>
                        <Route index element={<AdminAnalytics />} />
                        <Route path="cars" element={<AdminCars />} />
                        <Route path="users" element={<AdminUsers />} />
                        <Route path="bookings" element={<AdminBookings />} />
                        <Route path="payments" element={<AdminPayments />} />
                      </Route>
                    </Route>
                  </Routes>
                </Suspense>
                </ErrorBoundary>
              </BrowserRouter>
            </FavoritesProvider>
          </DataProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
