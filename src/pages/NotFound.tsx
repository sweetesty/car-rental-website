import { LinkButton } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-28 text-center">
      <p className="text-brand-600 dark:text-brand-400 text-7xl font-black tracking-tight">404</p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">This road doesn't go anywhere</h1>
      <p className="text-dim mt-3 text-pretty">
        The page you're after has moved or never existed. Let's get you back on route.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <LinkButton to="/">Back to home</LinkButton>
        <LinkButton to="/cars" variant="secondary">
          Browse cars
        </LinkButton>
      </div>
    </div>
  )
}
