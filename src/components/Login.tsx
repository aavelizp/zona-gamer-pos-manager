import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('¡Registro exitoso! Ya puedes iniciar sesión.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'Error al autenticar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0914] flex items-center justify-center p-4 font-sans">
      <div className="bg-[#13111C] border border-[#2D2445] rounded-xl p-8 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8 flex flex-col items-center">
          {/* Icono de control simulado */}
          <div className="w-12 h-12 bg-[#2D2445] rounded-full flex items-center justify-center mb-4">
            <span className="text-[#9E54FF] text-2xl">🎮</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-wider mb-1">
            TWINS GAMER
          </h1>
          <p className="text-xs text-gray-400 tracking-widest uppercase">POS · Venezuela</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold mb-2 text-gray-300 uppercase tracking-wider">Usuario / Correo</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0B0914] border border-[#2D2445] rounded-lg p-3 text-white focus:outline-none focus:border-[#9E54FF] transition-colors"
              placeholder="admin@twinsgamer.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-2 text-gray-300 uppercase tracking-wider">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0B0914] border border-[#2D2445] rounded-lg p-3 text-white focus:outline-none focus:border-[#9E54FF] transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#FF5E98] to-[#9E54FF] text-white font-bold rounded-lg p-3 hover:opacity-90 transition-opacity disabled:opacity-50 mt-4"
          >
            {loading ? 'Cargando...' : isSignUp ? 'Crear Cuenta Administrador' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-gray-500 hover:text-white transition-colors"
          >
            {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : 'Crear nueva cuenta'}
          </button>
        </div>
      </div>
    </div>
  );
}