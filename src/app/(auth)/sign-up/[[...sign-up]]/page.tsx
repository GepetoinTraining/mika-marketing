// app/(auth)/sign-up/[[...sign-up]]/page.tsx
'use client'
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="auth-page">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl="/onboarding"
      />
      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-primary);
        }
      `}</style>
    </div>
  );
}