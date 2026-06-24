import { useState } from 'react';
import { useNavigate, Navigate, Link, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Waves, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('manager@devox.ma');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/board" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      const to = location.state?.from?.pathname || '/board';
      navigate(to, { replace: true });
    } catch (err) {
      setError(apiError(err, 'Connexion impossible.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Marque */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-white lg:flex">
        <div className="relative z-10 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15">
            <Waves className="h-6 w-6" />
          </div>
          <span className="text-xl font-semibold">Cadence</span>
        </div>
        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-bold leading-tight">
            Planifiez vos sprints selon la capacité réelle de l'équipe.
          </h2>
          <p className="mt-4 text-white/85">
            Kanban, congés et capacité réunis. Fini les sprints surchargés : Cadence calcule les heures
            réellement disponibles et alerte en cas de dépassement.
          </p>
          <div className="mt-8 space-y-3 text-sm">
            {['Tableau Kanban par sprint', 'Capacité = jours travaillés − congés', 'Alerte de surcharge automatique'].map(
              (t) => (
                <div key={t} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-white/70" /> {t}
                </div>
              )
            )}
          </div>
        </div>
        <div className="relative z-10 text-xs text-white/70">Devox · Témara — projet de stage</div>
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
      </div>

      {/* Formulaire */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-white">
              <Waves className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold">Cadence</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Connexion</h1>
          <p className="mt-1 text-sm text-slate-500">Accédez à votre espace de pilotage agile.</p>

          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input id="email" type="email" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input id="password" type="password" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Se connecter <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Pas encore de compte ?{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Créer un compte
            </Link>
          </p>

          <div className="mt-8 rounded-lg border bg-white p-3 text-xs text-slate-500">
            <div className="mb-1 font-medium text-slate-600">Comptes de démo (mdp : password123)</div>
            admin@devox.ma · manager@devox.ma · dev1@devox.ma
          </div>
        </div>
      </div>
    </div>
  );
}
