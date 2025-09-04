import { SignIn } from '@clerk/nextjs'

export default function Page() {
  return (
  <div className="flex flex-col flex-1 items-center">
      <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
    </div>
  )
}