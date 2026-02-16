import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, LogOut, ArrowLeft, KeyRound, Pencil, Check, X, MoreHorizontal } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import SEOHead from '@/components/SEOHead';
import PageLayout from '@/components/PageLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  const createdAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : '';
  const initials = fullName
    ? fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : email[0]?.toUpperCase() || 'U';

  const handleSaveName = async () => {
    if (!nameValue.trim()) return;
    setSavingName(true);
    const { error } = await supabase.auth.updateUser({ data: { full_name: nameValue.trim() } });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      await supabase.from('profiles').update({ display_name: nameValue.trim() }).eq('id', user.id);
      toast({ title: 'Name updated', description: 'Your name has been saved.' });
      setEditingName(false);
    }
    setSavingName(false);
  };

  return (
    <PageLayout>
      <SEOHead title="Profile — XDROP" description="Your XDROP profile" canonicalPath="/profile" />
      <div className="w-full max-w-[600px] mx-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center gap-3">
          <Link to="/" className="p-1.5 -ml-1.5 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <div>
            <h1 className="text-base font-bold font-display text-foreground tracking-tight leading-tight">
              {fullName || 'User'}
            </h1>
          </div>
        </div>

        {/* Banner area */}
        <div className="h-32 bg-secondary relative" />

        {/* Profile header section */}
        <div className="px-4 pb-4 relative">
          {/* Avatar - overlapping banner */}
          <div className="-mt-12 mb-3 flex items-end justify-between">
            <Avatar className="w-24 h-24 border-4 border-background">
              <AvatarImage src={avatarUrl} alt={fullName} />
              <AvatarFallback className="text-2xl font-bold bg-secondary text-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>

            {/* Actions */}
            <div className="flex items-center gap-2 pb-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full w-9 h-9 border-border">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={async () => {
                      if (!email || resettingSent) return;
                      setResettingSent(true);
                      try {
                        const { error } = await supabase.auth.resetPasswordForEmail(email, {
                          redirectTo: `${window.location.origin}/reset-password`,
                        });
                        if (error) throw error;
                        toast({ title: 'Reset email sent', description: `Check your inbox at ${email}` });
                      } catch {
                        toast({ title: 'Error', description: 'Failed to send reset email.', variant: 'destructive' });
                        setResettingSent(false);
                      }
                    }}
                    disabled={resettingSent}
                  >
                    <KeyRound className="w-4 h-4 mr-2" />
                    {resettingSent ? 'Email Sent' : 'Reset Password'}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                className="rounded-full px-4 h-9 font-semibold text-sm border-border"
                onClick={() => { setNameValue(fullName); setEditingName(true); }}
              >
                Edit profile
              </Button>
            </div>
          </div>

          {/* Name & handle */}
          <div className="mb-3">
            {editingName ? (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 mb-1"
              >
                <input
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  className="flex-1 bg-secondary rounded-lg py-2 px-3 text-sm text-foreground border border-border focus:border-foreground/20 focus:outline-none transition-all font-semibold"
                  placeholder="Your name"
                />
                <button
                  disabled={savingName}
                  onClick={handleSaveName}
                  className="p-2 rounded-full hover:bg-secondary text-green-500 transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setEditingName(false)}
                  className="p-2 rounded-full hover:bg-secondary text-muted-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ) : (
              <div className="flex items-center gap-1.5">
                <h2 className="text-xl font-bold text-foreground font-display tracking-tight">
                  {fullName || 'User'}
                </h2>
                <button
                  onClick={() => { setNameValue(fullName); setEditingName(true); }}
                  className="p-1 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>

          {/* Joined date */}
          {createdAt && (
            <div className="flex items-center gap-1.5 text-muted-foreground mb-4">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Joined {createdAt}</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-b border-border" />

        {/* Empty state for future content */}
        <div className="px-4 py-16 text-center">
          <p className="text-muted-foreground text-sm">No activity yet</p>
        </div>
      </div>
    </PageLayout>
  );
};

export default Profile;
