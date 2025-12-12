// app/(auth)/sign-in/[[...sign-in]]/page.tsx
'use client'
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="auth-page">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        forceRedirectUrl="/dashboard"
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