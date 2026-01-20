import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LogOut, Download, ExternalLink, Calendar, ChevronDown, ChevronUp, FolderDown } from 'lucide-react';
import logo from '../assets/Logotipo/maju-branco.png';
import background from '../assets/Background.png';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

type Briefing = {
    id: number;
    created_at: string;
    company_name: string;
    contact_info: { name: string; email: string; phone: string };
    target_audience: string;
    slogans: string;
    prior_experience: string;
    launch_event_date: string;
    files_link: string;
    visual_identity_files: string[];
    logo_preference: string;
    colors_typography: string;
    reference_links: string;
    expectations: string;
};

export const Dashboard = () => {
    const navigate = useNavigate();
    const [briefings, setBriefings] = useState<Briefing[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [downloadingId, setDownloadingId] = useState<number | null>(null);

    useEffect(() => {
        const checkAuth = () => {
            const isAuth = localStorage.getItem('isAuthenticated');
            if (!isAuth) {
                navigate('/admin');
            }
        };

        checkAuth();
        fetchBriefings();
    }, [navigate]);

    const fetchBriefings = async () => {
        try {
            const { data, error } = await supabase
                .from('briefings')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBriefings(data || []);
        } catch (error) {
            console.error('Error fetching briefings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        navigate('/admin');
    };

    const toggleExpand = (id: number) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const handleDownloadAll = async (e: React.MouseEvent, briefing: Briefing) => {
        e.stopPropagation();
        if (!briefing.visual_identity_files || briefing.visual_identity_files.length === 0) return;

        setDownloadingId(briefing.id);
        const zip = new JSZip();

        try {
            const downloadPromises = briefing.visual_identity_files.map(async (url, index) => {
                const response = await fetch(url);
                const blob = await response.blob();
                // Try to get filename from url or fallback to generic
                const urlParts = url.split('/');
                const fileName = urlParts[urlParts.length - 1] || `arquivo_${index + 1}`;
                zip.file(fileName, blob);
            });

            await Promise.all(downloadPromises);

            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, `briefing_${briefing.company_name.replace(/\s+/g, '_')}_arquivos.zip`);
        } catch (error) {
            console.error('Error creating zip:', error);
            alert('Erro ao baixar arquivos. Tente novamente.');
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#111111] text-white font-sans bg-cover bg-center bg-fixed" style={{ backgroundImage: `url(${background})` }}>
            <div className="absolute inset-0 bg-black/60 pointer-events-none fixed" />

            <div className="relative z-10">
                {/* Header */}
                <header className="bg-black/40 border-b border-white/5 sticky top-0 z-50 backdrop-blur-md">
                    <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
                        <img src={logo} alt="Maju" className="h-8 md:h-10 drop-shadow-lg" />
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-white/80 hidden md:block font-light">Painel Administrativo</span>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 text-white/80 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full transition-all border border-white/10 text-sm font-medium backdrop-blur-sm"
                            >
                                <LogOut size={16} /> <span className="hidden sm:inline">Sair</span>
                            </button>
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-4 md:px-8 py-12">
                    <h1 className="text-3xl md:text-4xl font-bold mb-8 text-white drop-shadow-md">Briefings Recebidos</h1>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                        </div>
                    ) : briefings.length === 0 ? (
                        <div className="text-center py-20 text-white/50 bg-black/40 backdrop-blur-sm rounded-3xl border border-white/5">
                            <p className="text-xl font-light">Nenhum briefing encontrado.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6">
                            {briefings.map((briefing) => (
                                <div key={briefing.id} className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all shadow-xl">
                                    {/* Card Header */}
                                    <div
                                        className="p-6 md:p-8 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6 group"
                                        onClick={() => toggleExpand(briefing.id)}
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-2xl font-bold text-white tracking-tight group-hover:text-blue-200 transition-colors">{briefing.company_name || 'Sem nome'}</h3>
                                                {briefing.visual_identity_files && briefing.visual_identity_files.length > 0 && (
                                                    <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-0.5 rounded-full border border-blue-500/20">
                                                        {briefing.visual_identity_files.length} arquivos
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-white/60 text-sm">
                                                <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(briefing.created_at).toLocaleDateString('pt-BR')} às {new Date(briefing.created_at).toLocaleTimeString('pt-BR')}</span>
                                                <span className="hidden md:inline text-white/20">•</span>
                                                <span className="flex items-center gap-1.5">{briefing.contact_info?.name}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {briefing.visual_identity_files && briefing.visual_identity_files.length > 1 && (
                                                <button
                                                    onClick={(e) => handleDownloadAll(e, briefing)}
                                                    disabled={downloadingId === briefing.id}
                                                    className="flex items-center gap-2 bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-full text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                                                >
                                                    {downloadingId === briefing.id ? (
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                                                    ) : (
                                                        <FolderDown size={16} />
                                                    )}
                                                    <span className="hidden sm:inline">Baixar Tudo (ZIP)</span>
                                                </button>
                                            )}

                                            <div className="bg-white/5 p-2 rounded-full group-hover:bg-white/10 transition-colors">
                                                {expandedId === briefing.id ? <ChevronUp className="text-white/70" /> : <ChevronDown className="text-white/70" />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    {expandedId === briefing.id && (
                                        <div className="px-6 pb-8 md:px-8 md:pb-10 pt-4 border-t border-white/5 text-gray-300">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 animate-fade-in">

                                                {/* Contact & Details Grid */}
                                                <div className="space-y-6">
                                                    <div>
                                                        <h4 className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-wider font-bold mb-3">
                                                            Informações de Contato
                                                        </h4>
                                                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-2">
                                                            <p className="flex items-center gap-2"><span className="text-white font-medium min-w-[80px]">Email:</span> {briefing.contact_info?.email}</p>
                                                            <p className="flex items-center gap-2"><span className="text-white font-medium min-w-[80px]">Telefone:</span> {briefing.contact_info?.phone}</p>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h4 className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-wider font-bold mb-3">
                                                            Detalhes do Projeto
                                                        </h4>
                                                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-2">
                                                            <p className="flex items-center gap-2"><span className="text-white font-medium min-w-[80px]">Logotipo:</span> {briefing.logo_preference === 'exclusive' ? 'Exclusivo (Novo)' : 'Existente'}</p>
                                                            <p className="flex items-center gap-2"><span className="text-white font-medium min-w-[80px]">Previsão:</span> {briefing.launch_event_date || 'Não informada'}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Files Section First on Mobile if desired, but keeping grid flow */}
                                                <div className="md:row-span-2">
                                                    <h4 className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-wider font-bold mb-3">
                                                        Arquivos e Downloads
                                                    </h4>

                                                    <div className="space-y-4">
                                                        {briefing.files_link && (
                                                            <a
                                                                href={briefing.files_link}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center justify-between p-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/40 rounded-xl group transition-all"
                                                            >
                                                                <span className="flex items-center gap-3 text-blue-200 font-medium">
                                                                    <div className="p-2 bg-blue-500/20 rounded-lg"><ExternalLink size={18} /></div>
                                                                    Link Externo (Drive/Dropbox)
                                                                </span>
                                                                <ArrowRightIcon className="text-blue-500/50 group-hover:translate-x-1 transition-transform" />
                                                            </a>
                                                        )}

                                                        {briefing.visual_identity_files && briefing.visual_identity_files.length > 0 ? (
                                                            <div className="grid grid-cols-1 gap-2">
                                                                {briefing.visual_identity_files.map((file, idx) => (
                                                                    <a
                                                                        key={idx}
                                                                        href={file}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="flex items-center justify-between group bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 p-3 rounded-lg transition-all"
                                                                    >
                                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                                            <div className="bg-white/10 p-2 rounded text-white/70">
                                                                                <Download size={16} />
                                                                            </div>
                                                                            <span className="text-sm text-white/80 group-hover:text-white truncate">Arquivo {idx + 1}</span>
                                                                        </div>
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            !briefing.files_link && (
                                                                <div className="p-8 text-center border border-white/5 border-dashed rounded-xl bg-white/5">
                                                                    <p className="text-white/30 italic">Nenhum arquivo anexado.</p>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Text Content */}
                                                <div className="md:col-span-2 space-y-8 pt-4">
                                                    <div>
                                                        <h4 className="text-white/40 text-xs uppercase tracking-wider font-bold mb-3">Expectativas e Descrição</h4>
                                                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5 leading-relaxed text-white/90">
                                                            {briefing.expectations ? (
                                                                <p className="whitespace-pre-wrap">{briefing.expectations}</p>
                                                            ) : (
                                                                <p className="text-white/30 italic">Não informado.</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                        <div>
                                                            <h4 className="text-white/40 text-xs uppercase tracking-wider font-bold mb-3">Público Alvo</h4>
                                                            <div className="bg-white/5 p-5 rounded-xl border border-white/5 text-white/90">
                                                                {briefing.target_audience || <p className="text-white/30 italic">Não informado.</p>}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-white/40 text-xs uppercase tracking-wider font-bold mb-3">Referências e Links</h4>
                                                            <div className="bg-white/5 p-5 rounded-xl border border-white/5 text-white/90">
                                                                {briefing.reference_links ? (
                                                                    <p className="whitespace-pre-wrap">{briefing.reference_links}</p>
                                                                ) : (
                                                                    <p className="text-white/30 italic">Não informado.</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

// Helper Icon
const ArrowRightIcon = ({ className }: { className?: string }) => (
    <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
);
