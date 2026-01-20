import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface StepContainerProps {
    children: React.ReactNode;
    isActive: boolean;
    onNext?: () => void;
    onPrev?: () => void;
    isFirst?: boolean;
    isLast?: boolean;
    canAdvance?: boolean;
    direction?: number; // 1 for forward, -1 for backward
}

const variants = {
    enter: (direction: number) => ({
        y: direction > 0 ? 50 : -50,
        opacity: 0,
        scale: 0.95
    }),
    center: {
        zIndex: 1,
        y: 0,
        opacity: 1,
        scale: 1
    },
    exit: (direction: number) => ({
        zIndex: 0,
        y: direction < 0 ? 50 : -50,
        opacity: 0,
        scale: 0.95
    })
};

export const StepContainer: React.FC<StepContainerProps> = ({
    children,
    isActive,
    onNext,
    onPrev,
    isFirst = false,
    isLast = false,
    canAdvance = true,
    direction = 1,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isActive && containerRef.current) {
            containerRef.current.focus();
        }
    }, [isActive]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Prevent default behavior to avoid scrolling or other unwanted actions
        // if (e.key === 'Enter') e.preventDefault(); 

        if (e.key === 'Enter' && !e.shiftKey && canAdvance && onNext) {
            onNext();
        }
    };

    return (
        <AnimatePresence mode="popLayout" custom={direction}>
            {isActive && (
                <motion.div
                    key="step-content"
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        y: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.4 },
                        scale: { duration: 0.4 }
                    }}
                    ref={containerRef}
                    className="absolute inset-0 flex flex-col items-center justify-center p-6 md:p-12 outline-none"
                    onKeyDown={handleKeyDown}
                    tabIndex={isActive ? 0 : -1}
                >
                    <div className="w-full max-w-3xl flex flex-col gap-8">
                        {children}

                        <div className="flex gap-4 mt-8">
                            {!isFirst && onPrev && (
                                <button
                                    onClick={onPrev}
                                    className="flex items-center gap-2 px-6 py-3 rounded text-white hover:bg-white/10 transition-colors backdrop-blur-sm bg-black/20"
                                >
                                    <ArrowLeft size={20} />
                                    Anterior
                                </button>
                            )}

                            {onNext && (
                                <button
                                    onClick={onNext}
                                    disabled={!canAdvance}
                                    className={`flex items-center gap-2 px-8 py-3 rounded bg-white text-black font-bold text-lg hover:scale-105 active:scale-95 transition-all
                    ${!canAdvance ? 'opacity-50 cursor-not-allowed' : 'shadow-lg hover:shadow-xl'}
                  `}
                                >
                                    {isLast ? 'Enviar' : 'OK'}
                                    <ArrowRight size={20} />
                                </button>
                            )}
                        </div>

                        <div className="text-white/40 text-sm mt-4 hidden md:flex items-center gap-2">
                            <span className="px-2 py-1 bg-white/10 rounded text-xs font-mono">Enter ↵</span> <span>para continuar</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
