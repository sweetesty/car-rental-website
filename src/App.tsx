import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { RequireRole } from '@/components/layout/RequireRole'
import { Spinner } from '@/components/ui/Misc'
import { ThemeProvider } from '@/context/ThemeContext'
import { AuthProvider } from '@/context/AuthContext'
import { DataProvider } from '@/context/DataContext'
import { FavoritesProvider } from '@/context/FavoritesContext'
import { ToastProvider } from '@/context/ToastContext'
import Home from '@/pages/Home'

/* Everything past the landing page is split out — the homepage ships alone. */
const Cars = lazy(() => import('@/pages/Cars'))
const CarDetails = lazy(() => import('@/pages/CarDetails'))
const Compare = lazy(() => import('@/pages/Compare'))
const Favorites = lazy(() => import('@/pages/Favorites'))
const Booking = lazy(() => import('@/pages/Booking'))
const BookingConfirmed = lazy(() => import('@/pages/BookingConfirmed'))
const HowItWorks = lazy(() => import('@/pages/HowItWorks'))
const WhyAutogo = lazy(() => import('@/pages/WhyAutogo'))
const BecomeAHost = lazy(() => import('@/pages/BecomeAHost'))
const NotFound = lazy(() => import('@/pages/NotFound'))
const Login = lazy(() => import('@/pages/Login'))
const Register = lazy(() => import('@/pages/Register'))

const TrustAndSafety = lazy(() =>
  import('@/pages/Content').then((m) => ({ default: m.TrustAndSafety })),
)
const Support = lazy(() => import('@/pages/Content').then((m) => ({ default: m.Support })))
const Terms = lazy(() => import('@/pages/Content').then((m) => ({ default: m.Terms })))
const Privacy = lazy(() => import('@/pages/Content').then((m) => ({ default: m.Privacy })))

const MyBookings = lazy(() => import('@/pages/dashboard/MyBookings'))
const MyReviews = lazy(() => import('@/pages/dashboard/MyReviews'))
const MyPayments = lazy(() => import('@/pages/dashboard/MyPayments'))
const Profile = lazy(() => import('@/pages/dashboard/Profile'))

const OwnerOverview = lazy(() => import('@/pages/dashboard/OwnerOverview'))
const OwnerCars = lazy(() => import('@/pages/dashboard/OwnerCars'))
const CarForm = lazy(() => import('@/pages/dashboard/CarForm'))
const OwnerBookings = lazy(() => import('@/pages/dashboard/OwnerBookings'))
const OwnerCalendar = lazy(() => import('@/pages/dashboard/OwnerCalendar'))
const OwnerEarnings = lazy(() => import('@/pages/dashboard/OwnerEarnings'))

const AdminAnalytics = lazy(() => import('@/pages/dashboard/AdminAnalytics'))
const AdminCars = lazy(() => import('@/pages/dashboard/AdminCars'))
const AdminUsers = lazy(() => import('@/pages/dashboard/AdminUsers'))
const AdminBookings = lazy(() => import('@/pages/dashboard/AdminBookings'))
const AdminPayments = lazy(() => import('@/pages/dashboard/AdminPayments'))

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
                <Suspense fallback={<PageFallback />}>
                  <Routes>
                    {/* Auth screens use their own full-bleed shell. */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

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
              </BrowserRouter>
            </FavoritesProvider>
          </DataProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
