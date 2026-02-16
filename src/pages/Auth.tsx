import { useState, useRef, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import SEOHead from '@/components/SEOHead';
import xdropLogo from '@/assets/xdrop-logo.png';
import { supabase } from '@/integrations/supabase/client';

type AuthStep = 'form' | 'verify' | 'confirmed';

const Auth = () => {
  const { user, loading, signIn, signUp, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Verification state
  const [step, setStep] = useState<AuthStep>('form');
  const [code, setCode] = useState(['', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  const sendVerificationCode = async (targetEmail: string) => {
    const { data, error } = await supabase.functions.invoke('email-verification', {
      body: { action: 'send', email: targetEmail },
    });
    if (error) throw new Error('Failed to send verification code');
    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (isSignUp) {
      if (password !== confirmPassword) {
        toast({ title: 'Error', description: 'Passwords do not match.', variant: 'destructive' });
        setSubmitting(false);
        return;
      }
      if (!fullName.trim()) {
        toast({ title: 'Error', description: 'Please enter your full name.', variant: 'destructive' });
        setSubmitting(false);
        return;
      }
      // Send verification code first
      try {
        await sendVerificationCode(email);
        setStep('verify');
        setResendCooldown(60);
        toast({ title: 'Code sent', description: `We sent a 4-digit code to ${email}` });
      } catch {
        toast({ title: 'Error', description: 'Failed to send verification code. Please try again.', variant: 'destructive' });
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('invalid login credentials')) {
          toast({
            title: 'Sign in failed',
            description: 'Incorrect password, or this email is linked to Google Sign-In. Try signing in with Google instead.',
            variant: 'destructive',
          });
        } else {
          toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
      }
    }
    setSubmitting(false);
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted.length === 4) {
      setCode(pasted.split(''));
      inputRefs.current[3]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 4) return;

    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('email-verification', {
        body: { action: 'verify', email, code: fullCode },
      });

      if (error || !data?.verified) {
        toast({ title: 'Invalid code', description: 'The code is incorrect or expired. Please try again.', variant: 'destructive' });
        setCode(['', '', '', '']);
        inputRefs.current[0]?.focus();
        setVerifying(false);
        return;
      }

      // Code verified — now create the account
      const { error: signUpError } = await signUp(email, password, fullName.trim());
      if (signUpError) {
        const msg = signUpError.message.toLowerCase();
        if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('unique constraint') || msg.includes('duplicate')) {
          toast({
            title: 'Account already exists',
            description: 'This email is already registered — possibly via Google Sign-In. Try signing in with Google or use your existing password.',
            variant: 'destructive',
          });
          setStep('form');
          setIsSignUp(false);
          setCode(['', '', '', '']);
        } else {
          toast({ title: 'Error', description: signUpError.message, variant: 'destructive' });
        }
        setVerifying(false);
        return;
      }

      setStep('confirmed');
    } catch {
      toast({ title: 'Error', description: 'Verification failed. Please try again.', variant: 'destructive' });
    }
    setVerifying(false);
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await sendVerificationCode(email);
      setResendCooldown(60);
      setCode(['', '', '', '']);
      toast({ title: 'Code resent', description: `New code sent to ${email}` });
    } catch {
      toast({ title: 'Error', description: 'Failed to resend code', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <SEOHead title="Sign In — XDROP" description="Sign in to XDROP" canonicalPath="/auth" />

      <AnimatePresence mode="wait">
        {step === 'form' && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-sm mx-4 bg-card border border-border rounded-xl p-8"
          >
            <div className="flex flex-col items-center mb-8">
              <Link to="/">
                <img src={xdropLogo} alt="XDROP" className="w-10 h-10 invert mb-3 hover:opacity-80 transition-opacity" />
              </Link>
              <Link to="/" className="hover:opacity-80 transition-opacity">
                <h1 className="text-xl font-bold text-foreground font-display tracking-tight">XDROP</h1>
              </Link>
              <p className="text-sm text-muted-foreground mt-1">
                {isSignUp ? 'Create your account' : 'Welcome back'}
              </p>
            </div>

            <Button
              onClick={() => signInWithGoogle()}
              variant="outline"
              className="w-full mb-4 py-5 rounded-lg border-border hover:bg-secondary gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </Button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {isSignUp && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full bg-secondary rounded-lg py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:border-foreground/20 focus:outline-none transition-all"
                  />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-secondary rounded-lg py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:border-foreground/20 focus:outline-none transition-all"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-secondary rounded-lg py-3 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:border-foreground/20 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {isSignUp && (
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full bg-secondary rounded-lg py-3 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:border-foreground/20 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              )}
              <Button
                type="submit"
                disabled={submitting}
                className="w-full py-5 rounded-lg bg-foreground text-background font-semibold hover:opacity-90 transition-opacity"
              >
                {submitting ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
              </Button>
            </form>

            {!isSignUp && (
              <div className="text-center mt-3">
                <button
                  type="button"
                  onClick={async () => {
                    if (!email.trim()) {
                      toast({ title: 'Enter your email', description: 'Please enter your email address above first.', variant: 'destructive' });
                      return;
                    }
                    try {
                      const { error } = await supabase.auth.resetPasswordForEmail(email, {
                        redirectTo: `${window.location.origin}/reset-password`,
                      });
                      if (error) throw error;
                      toast({ title: 'Reset email sent', description: `Check your inbox at ${email} for a password reset link.` });
                    } catch {
                      toast({ title: 'Error', description: 'Failed to send reset email. Please try again.', variant: 'destructive' });
                    }
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <p className="text-center text-sm text-muted-foreground mt-4">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-foreground hover:underline font-medium"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </motion.div>
        )}

        {step === 'verify' && (
          <motion.div
            key="verify"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-sm mx-4 bg-card border border-border rounded-xl p-8"
          >
            <button
              onClick={() => { setStep('form'); setCode(['', '', '', '']); }}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="flex flex-col items-center mb-8">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-foreground font-display">Verify your email</h2>
              <p className="text-sm text-muted-foreground mt-1 text-center">
                Enter the 4-digit code sent to<br />
                <span className="text-foreground font-medium">{email}</span>
              </p>
            </div>

            <div className="flex justify-center gap-3 mb-6" onPaste={handleCodePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(i, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(i, e)}
                  className="w-14 h-14 text-center text-2xl font-bold bg-secondary border border-border rounded-lg text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                  autoFocus={i === 0}
                />
              ))}
            </div>

            <Button
              onClick={handleVerify}
              disabled={verifying || code.join('').length !== 4}
              className="w-full py-5 rounded-lg bg-foreground text-background font-semibold hover:opacity-90 transition-opacity"
            >
              {verifying ? 'Verifying...' : 'Verify & Create Account'}
            </Button>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Didn't receive a code?{' '}
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="text-foreground hover:underline font-medium disabled:text-muted-foreground disabled:no-underline"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </button>
            </p>
          </motion.div>
        )}

        {step === 'confirmed' && (
          <motion.div
            key="confirmed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm mx-4 bg-card border border-border rounded-xl p-8 text-center"
          >
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4"
              >
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </motion.div>
              <h2 className="text-lg font-bold text-foreground font-display mb-2">Account Created!</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Your email has been verified. Check your inbox for a confirmation link to activate your account, then sign in.
              </p>
              <Button
                onClick={() => { setStep('form'); setIsSignUp(false); setCode(['', '', '', '']); setPassword(''); }}
                className="w-full py-5 rounded-lg bg-foreground text-background font-semibold hover:opacity-90 transition-opacity"
              >
                Go to Sign In
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Auth;
