import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, CheckCircle2, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const CATEGORIES = [
  'Bug or Error',
  'Content Violation',
  'Account Issue',
  'Payment Problem',
  'Agent Malfunction',
  'Feature Request',
  'Other',
];

interface ReportIssueDialogProps {
  open: boolean;
  onClose: () => void;
}

type Step = 'form' | 'submitting' | 'success';

const ReportIssueDialog = ({ open, onClose }: ReportIssueDialogProps) => {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('form');
  const [category, setCategory] = useState('');
  const [details, setDetails] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const reset = () => {
    setStep('form');
    setCategory('');
    setDetails('');
    setFile(null);
    setPreview(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5MB');
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handleSubmit = async () => {
    if (!user || !category) return;
    setStep('submitting');

    try {
      let screenshotUrl: string | null = null;

      if (file) {
        const ext = file.name.split('.').pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('report-screenshots')
          .upload(path, file);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('report-screenshots')
          .getPublicUrl(path);
        screenshotUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from('reports').insert({
        user_id: user.id,
        category,
        details: details.trim() || null,
        screenshot_url: screenshotUrl,
      } as any);

      if (error) throw error;
      setStep('success');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit report');
      setStep('form');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={handleClose} />
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className="relative w-full max-w-md bg-card border border-border rounded-xl p-6 z-10"
        >
          {step === 'form' && (
            <>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-foreground font-display">Report an Issue</h2>
                <button onClick={handleClose} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Category */}
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                Category *
              </label>
              <div className="flex flex-wrap gap-2 mb-4">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                      category === cat
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-secondary text-secondary-foreground border-border hover:border-primary/40'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Details */}
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                Details (optional)
              </label>
              <textarea
                value={details}
                onChange={e => setDetails(e.target.value)}
                placeholder="Describe the issue..."
                maxLength={1000}
                rows={3}
                className="w-full bg-secondary rounded-lg py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:border-foreground/20 focus:outline-none transition-all resize-none mb-4"
              />

              {/* Screenshot */}
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                Screenshot (optional)
              </label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="hidden"
              />
              {preview ? (
                <div className="relative mb-4">
                  <img src={preview} alt="Screenshot" className="w-full h-32 object-cover rounded-lg border border-border" />
                  <button
                    onClick={() => { setFile(null); setPreview(null); }}
                    className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background transition-colors"
                  >
                    <X className="w-3 h-3 text-foreground" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-dashed border-border hover:border-primary/40 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                  <ImageIcon className="w-4 h-4" />
                  Attach screenshot
                </button>
              )}

              {/* Submit */}
              <Button
                onClick={handleSubmit}
                disabled={!category}
                className="w-full py-5 rounded-lg bg-foreground text-background font-semibold hover:opacity-90 transition-opacity"
              >
                Submit Report
              </Button>
            </>
          )}

          {step === 'submitting' && (
            <div className="flex flex-col items-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-muted-foreground">Submitting your report...</p>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4"
              >
                <CheckCircle2 className="w-7 h-7 text-primary" />
              </motion.div>
              <h3 className="text-lg font-bold text-foreground font-display mb-1">Report Submitted</h3>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Thanks for letting us know. Our team will review your report and get back to you.
              </p>
              <Button
                onClick={handleClose}
                variant="outline"
                className="rounded-full px-6 border-border"
              >
                Done
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ReportIssueDialog;
