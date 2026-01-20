import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import background from '../assets/Background.png';
import logo from '../assets/Logotipo/maju-branco.png';

export const Login = () => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Hardcoded simple protection as requested in similar contexts
        if (password === '#M@ju!2026' || password === 'maju') {
            localStorage.setItem('isAuthenticated', 'true');
            navigate('/dashboard');
        } else {
            setError('Senha incorreta');
        }
    };

    return (
        <div className="relative w-full h-screen bg-cover bg-center font-sans flex items-center justify-center p-4" style={{ backgroundImage: `url(${background})` }}>
            <div className="absolute inset-0 bg-black/40" />

            <div className="relative z-10 w-full max-w-md bg-black/60 backdrop-blur-md p-8 rounded-2xl border border-white/10 shadow-2xl">
                <div className="flex justify-center mb-8">
                    <img src={logo} alt="Maju" className="h-12" />
                </div>

                <h2 className="text-2xl text-white font-bold text-center mb-6">Acesso Administrativo</h2>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-white/80 mb-2 text-sm">Senha de Acesso</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
                                placeholder="Digite sua senha"
                            />
                        </div>
                    </div>

                    {error && <p className="text-red-400 text-sm">{error}</p>}

                    <button
                        type="submit"
                        className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Entrar
                    </button>
                </form>
            </div>
        </div>
    );
};
