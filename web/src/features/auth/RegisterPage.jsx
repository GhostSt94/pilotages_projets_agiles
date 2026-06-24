import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { Waves, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { apiError, apiFieldErrors } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FieldError } from '@/components/common/FieldError';

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/board" replace />;

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setErrors({});
    if (form.password.length < 6) {
      setErrors({ password: 'Le mot de passe doit contenir au moins 6 caractères.' });
      return;
    }
    setLoading(true);
    try {
      await register(form);
      navigate('/board', { replace: true });
    } catch (err) {
      setErrors(apiFieldErrors(err));
      setError(apiError(err, 'Inscription impossible.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-white">
            <Waves className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">Cadence</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Créer un compte</h1>
        <p className="mt-1 text-sm text-slate-500">
          Vous serez inscrit comme <span className="font-medium">développeur</span>. Un admin pourra ensuite
          ajuster votre rôle et votre capacité.
        </p>

        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="name">Nom complet</Label>
            <Input id="name" value={form.name} onChange={(e) => set('name', e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} aria-invalid={!!errors.email} className={errors.email ? 'border-red-400 focus-visible:ring-red-200' : ''} required />
            <FieldError>{errors.email}</FieldError>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} aria-invalid={!!errors.password} className={errors.password ? 'border-red-400 focus-visible:ring-red-200' : ''} required />
            <FieldError>{errors.password}</FieldError>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Créer le compte <ArrowRight className="h-4 w-4" /></>}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Déjà un compte ?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
