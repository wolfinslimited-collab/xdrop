import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Settings, ToggleLeft, Megaphone, Shield, UserPlus, Save, Loader2, RefreshCw, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

const FUNC_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api`;

async function fetchSettings(session: any) {
  const res = await fetch(`${FUNC_URL}?action=get-settings`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
  });
  if (!res.ok) throw new Error('Failed to load settings');
  return res.json();
}

async function saveSettings(session: any, settings: Record<string, any>) {
  const res = await fetch(`${FUNC_URL}?action=save-settings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({ settings }),
  });
  if (!res.ok) throw new Error('Failed to save settings');
  return res.json();
}

export default function AdminSettings({ session }: { session: any }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Settings state
  const [maintenance, setMaintenance] = useState({ enabled: false, message: '' });
  const [banner, setBanner] = useState({ enabled: false, message: '', type: 'info' });
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [registration, setRegistration] = useState({ enabled: true, invite_only: false });

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const data = await fetchSettings(session);
      const map = new Map<string, any>((data.settings || []).map((s: any) => [s.key, s.value]));
      if (map.has('maintenance_mode')) setMaintenance(map.get('maintenance_mode') as typeof maintenance);
      if (map.has('announcement_banner')) setBanner(map.get('announcement_banner') as typeof banner);
      if (map.has('feature_flags')) setFeatures(map.get('feature_flags') as typeof features);
      if (map.has('registration')) setRegistration(map.get('registration') as typeof registration);
    } catch {
      toast({ title: 'Error', description: 'Failed to load settings', variant: 'destructive' });
    }
    setLoading(false);
  }, [session]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSettings(session, {
        maintenance_mode: maintenance,
        announcement_banner: banner,
        feature_flags: features,
        registration,
      });
      toast({ title: 'Settings saved', description: 'Platform settings have been updated.' });
      setDirty(false);
    } catch {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    }
    setSaving(false);
  };

  const update = <T,>(setter: React.Dispatch<React.SetStateAction<T>>, patch: Partial<T>) => {
    setter(prev => ({ ...prev, ...patch }));
    setDirty(true);
  };

  const toggleFeature = (key: string) => {
    setFeatures(prev => ({ ...prev, [key]: !prev[key] }));
    setDirty(true);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
      </div>
    );
  }

  const featureLabels: Record<string, { label: string; desc: string }> = {
    marketplace_enabled: { label: 'Marketplace', desc: 'Agent marketplace and purchasing' },
    arena_enabled: { label: 'Arena', desc: 'Agent battle arena and betting' },
    builder_enabled: { label: 'Builder', desc: 'AI agent builder interface' },
    wallet_enabled: { label: 'Wallet', desc: 'USDC wallet and transactions' },
    bot_chat_enabled: { label: 'Bot Chat', desc: 'Direct messaging with bots' },
  };

  return (
    <div className="p-6 space-y-5">
      {/* Save bar */}
      {dirty && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-3 rounded-xl bg-accent/10 border border-accent/20"
        >
          <span className="text-sm text-accent font-medium">You have unsaved changes</span>
          <Button onClick={handleSave} disabled={saving} size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Changes
          </Button>
        </motion.div>
      )}

      {/* Maintenance Mode */}
      <SettingsCard
        icon={AlertTriangle}
        iconColor="text-amber-400"
        iconBg="bg-amber-400/10"
        title="Maintenance Mode"
        description="Take the platform offline for maintenance"
        badge={maintenance.enabled ? <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px]">Active</Badge> : null}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="maint-toggle" className="text-sm text-foreground">Enable Maintenance Mode</Label>
            <Switch
              id="maint-toggle"
              checked={maintenance.enabled}
              onCheckedChange={(v) => update(setMaintenance, { enabled: v })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Maintenance Message</Label>
            <Textarea
              value={maintenance.message}
              onChange={e => update(setMaintenance, { message: e.target.value })}
              placeholder="We are currently performing maintenance..."
              className="bg-secondary/50 border-border text-sm min-h-[80px] resize-none"
            />
          </div>
        </div>
      </SettingsCard>

      {/* Announcement Banner */}
      <SettingsCard
        icon={Megaphone}
        iconColor="text-blue-400"
        iconBg="bg-blue-400/10"
        title="Announcement Banner"
        description="Show a platform-wide banner to all users"
        badge={banner.enabled ? <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-[10px]">Live</Badge> : null}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="banner-toggle" className="text-sm text-foreground">Show Banner</Label>
            <Switch
              id="banner-toggle"
              checked={banner.enabled}
              onCheckedChange={(v) => update(setBanner, { enabled: v })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Banner Message</Label>
            <Input
              value={banner.message}
              onChange={e => update(setBanner, { message: e.target.value })}
              placeholder="Important announcement..."
              className="bg-secondary/50 border-border text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Banner Type</Label>
            <Select value={banner.type} onValueChange={v => update(setBanner, { type: v })}>
              <SelectTrigger className="bg-secondary/50 border-border text-sm h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">ℹ️ Info</SelectItem>
                <SelectItem value="warning">⚠️ Warning</SelectItem>
                <SelectItem value="success">✅ Success</SelectItem>
                <SelectItem value="error">🚨 Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {banner.enabled && banner.message && (
            <div className={`p-3 rounded-lg text-xs ${
              banner.type === 'warning' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' :
              banner.type === 'error' ? 'bg-red-500/10 text-red-300 border border-red-500/20' :
              banner.type === 'success' ? 'bg-green-500/10 text-green-300 border border-green-500/20' :
              'bg-blue-500/10 text-blue-300 border border-blue-500/20'
            }`}>
              Preview: {banner.message}
            </div>
          )}
        </div>
      </SettingsCard>

      {/* Feature Flags */}
      <SettingsCard
        icon={ToggleLeft}
        iconColor="text-purple-400"
        iconBg="bg-purple-400/10"
        title="Feature Flags"
        description="Enable or disable platform features"
      >
        <div className="space-y-3">
          {Object.entries(featureLabels).map(([key, { label, desc }]) => (
            <div key={key} className="flex items-center justify-between py-1.5">
              <div>
                <p className="text-sm text-foreground">{label}</p>
                <p className="text-[10px] text-muted-foreground">{desc}</p>
              </div>
              <Switch
                checked={features[key] ?? true}
                onCheckedChange={() => toggleFeature(key)}
              />
            </div>
          ))}
        </div>
      </SettingsCard>

      {/* Registration Settings */}
      <SettingsCard
        icon={UserPlus}
        iconColor="text-cyan-400"
        iconBg="bg-cyan-400/10"
        title="Registration"
        description="Control user registration settings"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between py-1.5">
            <div>
              <p className="text-sm text-foreground">Allow Registration</p>
              <p className="text-[10px] text-muted-foreground">New users can create accounts</p>
            </div>
            <Switch
              checked={registration.enabled}
              onCheckedChange={(v) => update(setRegistration, { enabled: v })}
            />
          </div>
          <div className="flex items-center justify-between py-1.5">
            <div>
              <p className="text-sm text-foreground">Invite Only</p>
              <p className="text-[10px] text-muted-foreground">Require invitation to register</p>
            </div>
            <Switch
              checked={registration.invite_only}
              onCheckedChange={(v) => update(setRegistration, { invite_only: v })}
            />
          </div>
        </div>
      </SettingsCard>

      {/* Bottom save button */}
      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} disabled={saving || !dirty} className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save All Settings
        </Button>
      </div>
    </div>
  );
}

function SettingsCard({ icon: Icon, iconColor, iconBg, title, description, badge, children }: {
  icon: any; iconColor: string; iconBg: string; title: string; description: string; badge?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border p-5 space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-4.5 h-4.5 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            {badge}
          </div>
          <p className="text-[11px] text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </motion.div>
  );
}
