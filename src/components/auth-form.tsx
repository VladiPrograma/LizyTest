'use client';

import { useState, useRef } from 'react';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';
import { validateUsername } from '@/lib/username-validation';
import { signUpWithEmail } from '@/actions/auth';
import { Turnstile } from '@marsidev/react-turnstile';
import type { TurnstileInstance } from '@marsidev/react-turnstile';

interface AuthFormProps {
  onSuccess?: () => void;
}

export function AuthForm({ onSuccess }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setUsernameError('');

    if (!isLogin && value.length > 0) {
      const validation = validateUsername(value);
      if (!validation.isValid) {
        setUsernameError(validation.error!);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUsernameError('');

    // Show captcha on first submit attempt
    if (!showCaptcha) {
      setShowCaptcha(true);
      return;
    }

    // If captcha is shown but no token, wait for captcha completion
    if (showCaptcha && !captchaToken) {
      setError('Please complete the captcha');
      return;
    }

    setIsLoading(true);

    if (isLogin) {
      const { error } = await authClient.signIn.email({
        email,
        password,
        fetchOptions: {
          headers: {
            'x-captcha-response': captchaToken || '',
          },
        },
      });

      if (error) {
        setError(error.message || 'Something went wrong');
        setIsLoading(false);
        // Hide captcha and reset for next attempt
        setShowCaptcha(false);
        setCaptchaToken(null);
        turnstileRef.current?.reset();
        return;
      }
    } else {
      const usernameValidation = validateUsername(username);
      if (!usernameValidation.isValid) {
        setUsernameError(usernameValidation.error!);
        setIsLoading(false);
        return;
      }

      const signUpResult = await signUpWithEmail(
        email,
        password,
        usernameValidation.sanitized!,
        captchaToken || '',
      );

      if (signUpResult.error) {
        setError(signUpResult.error);
        setIsLoading(false);
        // Hide captcha and reset for next attempt
        setShowCaptcha(false);
        setCaptchaToken(null);
        turnstileRef.current?.reset();
        return;
      }


      const { error: signInError } = await authClient.signIn.email({
        email,
        password,
        fetchOptions: {
          headers: {
            'x-captcha-response': captchaToken || '',
          },
        },
      });

      if (signInError) {
        setError(signInError.message || 'Something went wrong');
        setIsLoading(false);
        // Hide captcha and reset for next attempt
        setShowCaptcha(false);
        setCaptchaToken(null);
        turnstileRef.current?.reset();
        return;
      }
    }

    onSuccess?.();
    setIsLoading(false);
    // Hide captcha after successful submission
    setShowCaptcha(false);
    setCaptchaToken(null);
    turnstileRef.current?.reset();
  };


  return (
    <div className="space-y-6">
      <div className="flex rounded-lg bg-white/5 border border-white/10 p-1">
          <button
            onClick={() => {
              setIsLogin(true);
              setError('');
              setUsernameError('');
              setShowCaptcha(false);
              setCaptchaToken(null);
            }}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
              isLogin
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              setError('');
              setUsernameError('');
              setShowCaptcha(false);
              setCaptchaToken(null);
            }}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
              !isLogin
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            }`}
          >
            Sign Up
          </button>
        </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/10 border border-input rounded-lg shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-foreground"
                placeholder="you@example.com"
                required
                disabled={isLoading}
              />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  className={`w-full px-4 py-2.5 bg-white/10 border rounded-lg shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all text-foreground ${
                    usernameError
                      ? 'border-destructive focus:ring-destructive/30 focus:border-destructive'
                      : 'border-input focus:ring-primary/30 focus:border-primary'
                  }`}
                  placeholder="username"
                  required
                  disabled={isLoading}
                />
                {usernameError && (
                  <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    {usernameError}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground flex items-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/10 border border-input rounded-lg shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-foreground"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>
          </>

        {showCaptcha && (
          <div className="flex flex-col items-center gap-2 my-4">
            <Turnstile
              key={`turnstile-${isLogin ? 'login' : 'signup'}`}
              ref={turnstileRef}
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
              onSuccess={(token) => {
                setCaptchaToken(token);
                setError(''); // Clear any previous errors when captcha is verified
                // Auto-submit the form once captcha is verified
                setTimeout(() => {
                  const form = document.querySelector('form');
                  if (form) {
                    form.requestSubmit();
                  }
                }, 100);
              }}
              onExpire={() => {
                setCaptchaToken(null);
              }}
              onError={() => {
                setCaptchaToken(null);
              }}
              options={{
                theme: 'dark',
                refreshExpired: 'auto',
                appearance: 'always'
              }}
            />
            {captchaToken && (
              <p className="text-xs text-green-500">✓ Captcha verified</p>
            )}
          </div>
        )}

        <div className="pt-2">
          <Button
            type="submit"
            disabled={isLoading}
            size="lg"
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25"
          >
          {isLoading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white mr-2" />
              {isLogin ? 'Signing in...' : 'Creating account...'}
            </>
          ) : (
            isLogin ? 'Sign In' : 'Create Account'
          )}
          </Button>
        </div>
      </form>
    </div>
  );
}
