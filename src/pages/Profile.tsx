import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Calendar, LogOut, ArrowLeft, User, KeyRound, Pencil, Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import SEOHead from '@/components/SEOHead';
import PageLayout from '@/components/PageLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Profile = () => {
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const [resettingSent, setResettingSent] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [savingName, setSavingName] = useState(false);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
  const avatarUrl = user.user_metadata?.avatar_url || '';
  const email = user.email || '';
  const createdAt = user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  const initials = fullName ? fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : email[0]?.toUpperCase() || 'U';

  return (
    <PageLayout>
      <SEOHead title="Profile — XDROP" description="Your XDROP profile" canonicalPath="/profile" />
      <div className="w-full max-w-[600px] mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center gap-3">
          <Link to="/" className="p-1.5 -ml-1.5 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <h1 className="text-lg font-bold font-display text-foreground tracking-tight">Profile</h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6"
        >
          {/* Avatar & Name */}
          <div className="flex flex-col items-center text-center mb-8">
            <Avatar className="w-20 h-20 mb-4">
              <AvatarImage src={avatarUrl} alt={fullName} />
              <AvatarFallback className="text-xl font-bold bg-secondary text-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold text-foreground font-display tracking-tight">
              {fullName || 'User'}
            </h2>
          </div>

          {/* Info Cards */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-4 px-4 py-3 rounded-lg bg-card border border-border">
              <Mail className="w-5 h-5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Email</p>
                <p className="text-sm text-foreground truncate">{email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 px-4 py-3 rounded-lg bg-card border border-border">
              <User className="w-5 h-5 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Full Name</p>
                {editingName ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      autoFocus
                      className="flex-1 bg-secondary rounded-md py-1.5 px-2 text-sm text-foreground border border-border focus:border-foreground/20 focus:outline-none transition-all"
                    />
                    <button
                      disabled={savingName}
                      onClick={async () => {
                        if (!nameValue.trim()) return;
                        setSavingName(true);
                        const { error } = await supabase.auth.updateUser({ data: { full_name: nameValue.trim() } });
                        if (error) {
                          toast({ title: 'Error', description: error.message, variant: 'destructive' });
                        } else {
                          // Also update profiles table
                          await supabase.from('profiles').update({ display_name: nameValue.trim() }).eq('id', user.id);
                          toast({ title: 'Name updated', description: 'Your name has been saved.' });
                          setEditingName(false);
                        }
                        setSavingName(false);
                      }}
                      className="p-1.5 rounded-md hover:bg-secondary text-green-500 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingName(false)}
                      className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-foreground">{fullName || '—'}</p>
                    <button
                      onClick={() => { setNameValue(fullName); setEditingName(true); }}
                      className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 px-4 py-3 rounded-lg bg-card border border-border">
              <Calendar className="w-5 h-5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Member Since</p>
                <p className="text-sm text-foreground">{createdAt}</p>
              </div>
            </div>
          </div>

          <Separator className="mb-8" />

          <div className="space-y-3">
            {/* Reset Password */}
            <Button
              variant="outline"
              disabled={resettingSent}
              onClick={async () => {
                if (!email) return;
                setResettingSent(true);
                try {
                  const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-password`,
                  });
                  if (error) throw error;
                  toast({ title: 'Reset email sent', description: `Check your inbox at ${email} for a password reset link.` });
                } catch {
                  toast({ title: 'Error', description: 'Failed to send reset email.', variant: 'destructive' });
                  setResettingSent(false);
                }
              }}
              className="w-full"
              size="lg"
            >
              <KeyRound className="w-4 h-4" />
              {resettingSent ? 'Reset Email Sent' : 'Reset Password'}
            </Button>

            {/* Logout */}
            <Button
              variant="outline"
              onClick={() => signOut()}
              className="w-full"
              size="lg"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </motion.div>
      </div>
    </PageLayout>
  );
};

export default Profile;
