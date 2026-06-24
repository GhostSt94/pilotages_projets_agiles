import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2, Wand2, Copy, Eye, EyeOff } from 'lucide-react';
import { useResetPassword } from '@/hooks/useUsers';
import { apiError } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FieldError } from '@/components/common/FieldError';

// Génère un mot de passe temporaire lisible (10 caractères).
function generatePassword() {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  const arr = new Uint32Array(10);
  (window.crypto || window.msCrypto).getRandomValues(arr);
  for (let i = 0; i < 10; i += 1) out += chars[arr[i] % chars.length];
  return out;
}

export function ResetPasswordDialog({ open, onOpenChange, user }) {
  const reset = useResetPassword();
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) { setPassword(''); setShow(false); setError(''); }
  }, [open]);

  async function copy() {
    try { await navigator.clipboard.writeText(password); toast.success('Mot de passe copié.'); } catch { /* ignore */ }
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (password.length < 6) { setError('6 caractères minimum.'); return; }
    try {
      await reset.mutateAsync({ id: user._id, password });
      toast.success(`Mot de passe réinitialisé pour ${user.name}.`);
      onOpenChange(false);
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <p className="text-sm text-slate-500">
            Définir un nouveau mot de passe pour <span className="font-medium text-slate-700">{user?.name}</span>{' '}
            (<span className="text-slate-500">{user?.email}</span>). Communiquez-le lui ; il pourra le changer ensuite.
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="rp-pass">Nouveau mot de passe</Label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  id="rp-pass"
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  className={error ? 'border-red-400 pr-9 focus-visible:ring-red-200' : 'pr-9'}
                  required
                />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-2 text-slate-400 hover:text-slate-600" aria-label="Afficher/masquer">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button type="button" variant="outline" size="icon" title="Générer" onClick={() => { setPassword(generatePassword()); setShow(true); setError(''); }}>
                <Wand2 className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" size="icon" title="Copier" onClick={copy} disabled={!password}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <FieldError>{error}</FieldError>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" disabled={reset.isPending}>
              {reset.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Réinitialiser
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
