import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { StepContainer } from '../components/StepContainer';
import { ProgressBar } from '../components/ProgressBar';
import { Input } from '../components/Input';
import { TextArea } from '../components/TextArea';
// import { AIAssistant } from '../components/AIAssistant';
import type { BriefingData } from '../types';
import background from '../assets/Background.png';
import logo from '../assets/Logotipo/maju-branco.png';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const INITIAL_DATA: BriefingData = {
    companyName: '',
    contactInfo: { name: '', email: '', phone: '' },
    targetAudience: '',
    slogans: '',
    priorExperience: '',
    launchEventDate: '',
    visualIdentityFiles: [],
    logoPreference: 'exclusive',
    colorsTypography: '',
    reference_links: '',
    expectations: ''
};

export const BriefingForm = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [data, setData] = useState<BriefingData>(INITIAL_DATA);
    const [isStarted, setIsStarted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const [direction, setDirection] = useState(0);

    // Upload state
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    type ActiveUpload = {
        id: string;
        name: string;
        progress: number;
    };

    const [activeUploads, setActiveUploads] = useState<ActiveUpload[]>([]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            await uploadFiles(Array.from(e.target.files));
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await uploadFiles(Array.from(e.dataTransfer.files));
        }
    };

    const uploadFiles = async (files: File[]) => {
        // Create initial upload entries
        const newUploads = files.map(file => ({
            id: Math.random().toString(36).substring(2),
            name: file.name,
            progress: 0,
            file // keep reference for upload
        }));

        setActiveUploads(prev => [...prev, ...newUploads.map(u => ({ id: u.id, name: u.name, progress: 0 }))]);

        // Process uploads in parallel
        const uploadPromises = newUploads.map(async (uploadItem) => {
            const { id, name, file } = uploadItem;

            // Simulate progress
            const progressInterval = setInterval(() => {
                setActiveUploads(prev => prev.map(u => {
                    if (u.id === id) {
                        const newProgress = u.progress + Math.random() * 10;
                        return { ...u, progress: Math.min(newProgress, 90) };
                    }
                    return u;
                }));
            }, 200);

            try {
                const fileExt = name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('briefing-files')
                    .upload(filePath, file);

                clearInterval(progressInterval);

                if (uploadError) {
                    console.error('Error uploading file:', uploadError);
                    alert(`Erro ao fazer upload de ${name}`);
                    // Remove from active uploads on error
                    setActiveUploads(prev => prev.filter(u => u.id !== id));
                    return null;
                }

                // Set to 100%
                setActiveUploads(prev => prev.map(u =>
                    u.id === id ? { ...u, progress: 100 } : u
                ));

                const { data: { publicUrl } } = supabase.storage
                    .from('briefing-files')
                    .getPublicUrl(filePath);

                // Add to final list
                updateFilesList(publicUrl);

                // Small delay to show 100% before removing
                await new Promise(resolve => setTimeout(resolve, 500));

                setActiveUploads(prev => prev.filter(u => u.id !== id));
                return publicUrl;
            } catch (error) {
                console.error('Error uploading:', error);
                clearInterval(progressInterval);
                setActiveUploads(prev => prev.filter(u => u.id !== id));
                return null;
            }
        });

        await Promise.all(uploadPromises);
    };

    const updateFilesList = (newUrl: string) => {
        setData(prev => ({
            ...prev,
            visualIdentityFiles: [...(prev.visualIdentityFiles || []), newUrl]
        }));
    };

    const removeFile = (indexToRemove: number) => {
        const updatedFiles = data.visualIdentityFiles?.filter((_, index) => index !== indexToRemove);
        updateData({ visualIdentityFiles: updatedFiles });
    };

    const totalSteps = 11;

    const handleNext = async () => {
        setDirection(1);
        if (currentStep < totalSteps - 1) {
            setCurrentStep(curr => curr + 1);
        } else {
            await handleSubmit();
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('briefings').insert({
                company_name: data.companyName,
                contact_info: data.contactInfo,
                target_audience: data.targetAudience,
                slogans: data.slogans,
                prior_experience: data.priorExperience,
                launch_event_date: data.launchEventDate,
                files_link: data.filesLink,
                visual_identity_files: data.visualIdentityFiles,
                logo_preference: data.logoPreference,
                colors_typography: data.colorsTypography,
                reference_links: data.reference_links,
                expectations: data.expectations,
            });

            if (error) throw error;

            // Send email notification
            try {
                await fetch('/.netlify/functions/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            } catch (emailError) {
                console.error('Error sending email notification:', emailError);
            }

            setSubmitStatus('success');
        } catch (error) {
            console.error('Error submitting briefing:', error);
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(curr => curr - 1);
        }
    };

    const updateData = (newData: Partial<BriefingData>) => {
        setData(prev => ({ ...prev, ...newData }));
    };

    const updateContact = (key: keyof BriefingData['contactInfo'], value: string) => {
        setData(prev => ({
            ...prev,
            contactInfo: { ...prev.contactInfo, [key]: value }
        }));
    };

    if (submitStatus === 'success') {
        return (
            <div className="flex flex-col items-center justify-center w-full h-screen bg-green-900 text-white p-4 text-center" style={{ backgroundImage: `url(${background})`, backgroundSize: 'cover' }}>
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative z-10 flex flex-col items-center">
                    <img src={logo} alt="Maju" className="w-32 md:w-48 mb-8 drop-shadow-lg" />
                    <CheckCircle size={80} className="text-green-400 mb-6" />
                    <h1 className="text-4xl font-bold mb-4">Briefing Enviado!</h1>
                    <p className="text-xl max-w-lg">Obrigado por compartilhar as informações. Nossa equipe entrará em contato em breve.</p>
                </div>
            </div>
        );
    }

    if (!isStarted) {
        return (
            <div className="relative w-full h-screen bg-cover bg-center overflow-hidden font-sans" style={{ backgroundImage: `url(${background})` }}>
                <div className="absolute inset-0 bg-black/20" />

                <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
                    <motion.img
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        src={logo} alt="Maju Personalizados" className="w-48 md:w-64 mb-8 drop-shadow-lg"
                    />

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                    >
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-md">
                            Vamos iniciar seu projeto!
                        </h1>

                        <p className="text-lg md:text-2xl text-gray-200 max-w-2xl mx-auto mb-12 drop-shadow-sm">
                            Responda nosso briefing para criarmos um e-commerce exclusivo e alinhado às suas expectativas.
                        </p>

                        <button
                            onClick={() => setIsStarted(true)}
                            className="group relative px-8 py-4 bg-white text-black text-lg font-bold rounded-full overflow-hidden shadow-xl hover:shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                COMEÇAR AGORA <ArrowRight size={20} />
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-200 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    </motion.div>
                </div>
            </div>
        )
    }

    return (
        <div className="relative w-full h-screen bg-cover bg-center overflow-hidden font-sans" style={{ backgroundImage: `url(${background})` }}>
            <div className="absolute inset-0 bg-black/20" />

            <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />

            <div className="relative z-10 w-full h-full">
                {/* Logo removed from here as per request */}


                <StepContainer isActive={currentStep === 0} onNext={handleNext} isFirst canAdvance={!!data.companyName && !!data.expectations} direction={direction}>
                    <h2 className="text-2xl md:text-4xl font-bold text-white mb-2">
                        Conexão entre a Empresa e o E-commerce
                    </h2>
                    <p className="text-white/60 text-lg mb-8 font-light max-w-2xl text-center">
                        A coleta das informações a seguir tem como principal objetivo alinhar a estratégia de desenvolvimento do e-commerce com as expectativas da empresa, garantindo que ela reflita os valores e objetivos da marca.
                    </p>
                    <Input
                        autoFocus
                        label="Qual o nome da sua empresa?"
                        placeholder="Ex: Maju Personalizados"
                        value={data.companyName}
                        onChange={(e) => updateData({ companyName: e.target.value })}
                    />
                    <TextArea
                        label="Expectativas"
                        sublabel="Fale um pouco sobre a sua empresa e quais são suas expectativas em relação à criação de um e-commerce."
                        placeholder="Descreva aqui..."
                        value={data.expectations}
                        onChange={(e) => updateData({ expectations: e.target.value })}
                    />
                </StepContainer>

                <StepContainer isActive={currentStep === 1} onNext={handleNext} onPrev={handlePrev} canAdvance={!!data.contactInfo.name && !!data.contactInfo.email && !!data.contactInfo.phone} direction={direction}>
                    <h2 className="text-2xl md:text-4xl font-bold text-white mb-6">
                        Informações de Contato
                    </h2>
                    <div className="flex flex-col gap-6 w-full max-w-xl">
                        <Input
                            label="Nome completo"
                            value={data.contactInfo.name}
                            onChange={(e) => updateContact('name', e.target.value)}
                        />
                        <Input
                            label="E-mail"
                            type="email"
                            value={data.contactInfo.email}
                            onChange={(e) => updateContact('email', e.target.value)}
                        />
                        <Input
                            label="Telefone / WhatsApp"
                            value={data.contactInfo.phone}
                            onChange={(e) => updateContact('phone', e.target.value)}
                        />
                    </div>
                </StepContainer>

                <StepContainer isActive={currentStep === 2} onNext={handleNext} onPrev={handlePrev} canAdvance={!!data.targetAudience} direction={direction}>
                    <h2 className="text-2xl md:text-4xl font-bold text-white mb-6">
                        Público-Alvo
                    </h2>
                    <TextArea
                        autoFocus
                        label="Quem você pretende alcançar?"
                        sublabel="Qual o público-alvo que você pretende alcançar com o desenvolvimento deste e-commerce? A venda dos produtos será direcionada a colaboradores, a grupos específicos dentro da empresa ou aos clientes finais?"
                        value={data.targetAudience}
                        onChange={(e) => updateData({ targetAudience: e.target.value })}
                    />
                </StepContainer>

                <StepContainer isActive={currentStep === 3} onNext={handleNext} onPrev={handlePrev} canAdvance={!!data.slogans} direction={direction}>
                    <h2 className="text-2xl md:text-4xl font-bold text-white mb-6">
                        Slogans e Propósito
                    </h2>
                    <TextArea
                        autoFocus
                        label="Slogans ou expressões"
                        sublabel="Com base nos propósitos e valores da sua empresa, existem slogans ou expressões que vocês gostariam de incorporar em produtos e coleções exclusivas?"
                        value={data.slogans}
                        onChange={(e) => updateData({ slogans: e.target.value })}
                    />
                </StepContainer>

                <StepContainer isActive={currentStep === 4} onNext={handleNext} onPrev={handlePrev} canAdvance={!!data.priorExperience} direction={direction}>
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                        5. Experiência Anterior
                    </h2>
                    <div className="flex flex-col gap-4 w-full max-w-xl">
                        <label className="text-xl md:text-2xl font-medium text-white mb-4">
                            A empresa já oferece produtos personalizados?
                        </label>
                        <div className="flex gap-4 w-full">
                            <button
                                onClick={() => updateData({ priorExperience: 'Sim, já oferecemos.' })}
                                className={`flex-1 p-6 rounded-xl border transition-all duration-300 text-left hover:scale-[1.02] ${data.priorExperience === 'Sim, já oferecemos.'
                                    ? 'bg-white/90 text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                                    : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/30'}`}
                            >
                                <span className="block text-xl font-medium mb-1">Sim</span>
                                <span className="text-sm opacity-70">Já temos experiência com personalizados.</span>
                            </button>
                            <button
                                onClick={() => updateData({ priorExperience: 'Não, é a primeira vez.' })}
                                className={`flex-1 p-6 rounded-xl border transition-all duration-300 text-left hover:scale-[1.02] ${data.priorExperience === 'Não, é a primeira vez.'
                                    ? 'bg-white/90 text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                                    : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/30'}`}
                            >
                                <span className="block text-xl font-medium mb-1">Não</span>
                                <span className="text-sm opacity-70">Esta será nossa primeira vez.</span>
                            </button>
                        </div>
                    </div>
                </StepContainer>

                <StepContainer isActive={currentStep === 5} onNext={handleNext} onPrev={handlePrev} canAdvance={!!data.launchEventDate} direction={direction}>
                    <h2 className="text-2xl md:text-4xl font-bold text-white mb-6">
                        Lançamento do E-commerce
                    </h2>
                    <Input
                        label="Previsão ou Evento de Lançamento"
                        sublabel="Há a possibilidade/pretensão de lançar o e-commerce durante um evento físico ou online? Se houver um evento específico planejado para esse lançamento, por favor, compartilhe a data."
                        placeholder="Ex: Evento anual em Dezembro"
                        value={data.launchEventDate}
                        onChange={(e) => updateData({ launchEventDate: e.target.value })}
                    />
                </StepContainer>

                <StepContainer isActive={currentStep === 6} onNext={handleNext} onPrev={handlePrev} direction={direction}>
                    <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
                        Identidade Visual
                    </h2>
                    <p className="text-white/60 text-lg mb-8 font-light max-w-xl text-center">
                        Um bom e-commerce deve refletir a identidade do seu negócio, e por esse motivo, as informações a seguir são tão importantes. Através delas, será possível desenvolvermos um projeto totalmente exclusivo e personalizado.
                    </p>
                    <div className="flex flex-col gap-6 w-full max-w-xl text-left">
                        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                            <h3 className="text-xl text-white font-medium mb-4">Envio de Materiais</h3>
                            <p className="text-white/70 text-sm mb-4">
                                Para a criação da identidade visual do seu e-commerce, é fundamental que você forneça o Manual de Identidade Visual (MIV) da sua marca, o logotipo em alta resolução, texturas e outros elementos visuais.
                            </p>
                            <Input
                                label="Link da pasta de arquivos"
                                sublabel="Informe abaixo o link com uma pasta para que possamos ter acesso aos arquivos, ou avance para próxima tela para anexá-los."
                                placeholder="http://..."
                                value={data.filesLink || ''}
                                onChange={(e) => updateData({ filesLink: e.target.value })}
                            />
                        </div>
                    </div>
                </StepContainer>

                <StepContainer isActive={currentStep === 7} onNext={handleNext} onPrev={handlePrev} direction={direction}>
                    <h2 className="text-2xl md:text-4xl font-bold text-white mb-2">
                        Envio de Materiais
                    </h2>
                    <p className="text-white/60 text-lg mb-8 font-light max-w-xl text-center">
                        Anexe abaixo arquivos nos formatos JPEG, PNG e PDF.
                    </p>
                    <div
                        className={`w-full max-w-xl p-12 border border-dashed rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer group
                        ${isDragging ? 'border-white bg-white/10 scale-105' : 'border-white/20 hover:bg-white/5 hover:border-white/40'}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            multiple
                            onChange={handleFileSelect}
                            accept="image/*,.pdf,.ai,.eps,.cdr,.zip,.rar"
                        />
                        <div className="w-16 h-16 mb-4 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <svg className="w-8 h-8 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                        </div>
                        <p className="text-white text-xl font-light mb-2">Arraste ou clique</p>
                        <p className="text-white/40 text-sm">JPEG, PNG, PDF</p>
                    </div>

                    {/* Active Uploads */}
                    {activeUploads.length > 0 && (
                        <div className="w-full max-w-xl mt-6 flex flex-col gap-3">
                            <h3 className="text-white/60 text-sm font-medium self-start">Enviando...</h3>
                            {activeUploads.map((upload) => (
                                <div key={upload.id} className="bg-white/5 p-4 rounded-xl border border-white/10">
                                    <div className="flex justify-between text-sm text-white mb-2">
                                        <span className="truncate max-w-[80%]">{upload.name}</span>
                                        <span>{Math.round(upload.progress)}%</span>
                                    </div>
                                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                                        <motion.div
                                            className="bg-blue-500 h-full rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${upload.progress}%` }}
                                            transition={{ duration: 0.2 }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* File List */}
                    {data.visualIdentityFiles && data.visualIdentityFiles.length > 0 && (
                        <div className="w-full max-w-xl mt-6 flex flex-col gap-3 animate-fade-in">
                            <h3 className="text-white/60 text-sm font-medium self-start">Arquivos anexados:</h3>
                            {data.visualIdentityFiles.map((fileUrl, index) => (
                                <div key={index} className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10 hover:border-white/30 transition-colors">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center text-blue-300">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                        </div>
                                        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-white/90 text-sm truncate hover:text-blue-400 transition-colors underline decoration-transparent hover:decoration-blue-400">
                                            Arquivo {index + 1} (Clique para ver)
                                        </a>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                                        className="text-white/30 hover:text-red-400 p-2 rounded-full hover:bg-white/5 transition-all"
                                        title="Remover arquivo"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </StepContainer>

                <StepContainer isActive={currentStep === 8} onNext={handleNext} onPrev={handlePrev} canAdvance={!!data.logoPreference && !!data.colorsTypography} direction={direction}>
                    <h2 className="text-2xl md:text-4xl font-bold text-white mb-6">
                        Logotipo e Cores
                    </h2>
                    <div className="flex flex-col gap-8 w-full max-w-xl">
                        <div className="flex flex-col gap-3">
                            <label className="text-lg text-white mb-2 font-light">O e-commerce contará com um logotipo exclusivo ou podemos utilizar o logotipo da sua marca?</label>
                            <button
                                onClick={() => updateData({ logoPreference: 'exclusive' })}
                                className={`p-6 rounded-xl border transition-all duration-300 text-left hover:scale-[1.01] ${data.logoPreference === 'exclusive'
                                    ? 'bg-white/90 text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                                    : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/30'}`}
                            >
                                <span className="block text-lg font-medium mb-1">Logotipo Exclusivo</span>
                                <span className="text-sm opacity-70">Criar um novo para a loja.</span>
                            </button>
                            <button
                                onClick={() => updateData({ logoPreference: 'keep_existing' })}
                                className={`p-6 rounded-xl border transition-all duration-300 text-left hover:scale-[1.01] ${data.logoPreference === 'keep_existing'
                                    ? 'bg-white/90 text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                                    : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/30'}`}
                            >
                                <span className="block text-lg font-medium mb-1">Logotipo da Marca</span>
                                <span className="text-sm opacity-70">Utilizar o atual com referência da loja.</span>
                            </button>
                        </div>

                        <TextArea
                            label="Paleta de Cores e Tipografia"
                            sublabel="A paleta de cores e a tipografia devem seguir o conceito da marca ou há um direcionamento diferente que vocês gostariam de explorar neste projeto?"
                            value={data.colorsTypography}
                            onChange={(e) => updateData({ colorsTypography: e.target.value })}
                        />
                    </div>
                </StepContainer>

                <StepContainer isActive={currentStep === 9} onNext={handleNext} onPrev={handlePrev} canAdvance={!!data.reference_links} direction={direction}>
                    <h2 className="text-2xl md:text-4xl font-bold text-white mb-6">
                        Referências
                    </h2>
                    <TextArea
                        autoFocus
                        label="Referências de E-commerces"
                        sublabel="Por favor, mencione alguns exemplos de e-commerces que representem o conceito que vocês desejam seguir na criação dessa identidade. (Col links)"
                        placeholder="Ex: apple.com, nike.com..."
                        value={data.reference_links}
                        onChange={(e) => updateData({ reference_links: e.target.value })}
                    />
                </StepContainer>

                <StepContainer isActive={currentStep === 10} onNext={handleNext} onPrev={handlePrev} isLast={true} canAdvance={!isSubmitting} direction={direction}>
                    <h2 className="text-2xl md:text-4xl font-bold text-white mb-6">
                        Expectativas e Objetivos
                    </h2>
                    <div className="space-y-6 w-full max-w-xl">
                        <p className="text-white/80 text-lg font-light leading-relaxed">
                            Agradecemos pelo envio das informações! Para finalizarmos, gostaríamos de saber qual é a sua expectativa e objetivos em relação ao projeto. Além disso, caso haja alguma informação adicional relevante, compartilhe conosco para garantirmos um processo de desenvolvimento alinhado às suas necessidades.
                        </p>
                    </div>
                </StepContainer>

            </div>

            {/* <AIAssistant /> */}
        </div>
    );
};
