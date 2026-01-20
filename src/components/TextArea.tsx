import React from 'react';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';

interface TextAreaProps extends HTMLMotionProps<"textarea"> {
    label: string;
    sublabel?: string;
    error?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, sublabel, error, className = '', ...props }) => {
    return (
        <div className={`flex flex-col gap-2 w-full max-w-xl ${className}`}>
            <label className="text-xl md:text-2xl font-medium text-white">
                {label}
                {props.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            {sublabel && (
                <p className="text-gray-300 text-sm md:text-base -mt-1 mb-2">{sublabel}</p>
            )}
            <motion.textarea
                whileFocus={{ scale: 1.01, borderBottomColor: "rgba(255, 255, 255, 1)" }}
                className={`w-full bg-transparent border-b border-white/20 text-white text-lg md:text-xl py-3 px-0 focus:outline-none focus:border-white transition-colors placeholder-white/20 font-light resize-none min-h-[100px] ${error ? 'border-red-400' : ''
                    }`}
                {...props}
            />
            {error && <span className="text-red-400 text-sm">{error}</span>}
        </div>
    );
};
