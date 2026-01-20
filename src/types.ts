export type BriefingData = {
    companyName: string;
    contactInfo: {
        name: string;
        email: string;
        phone: string;
    };
    targetAudience: string;
    slogans: string;
    priorExperience: string;
    launchEventDate: string;
    filesLink?: string;
    visualIdentityFiles: string[];
    logoPreference: 'exclusive' | 'keep_existing';
    colorsTypography: string;
    reference_links: string;
    expectations: string;
};

export type StepProps = {
    data: BriefingData;
    updateData: (data: Partial<BriefingData>) => void;
    onNext: () => void;
    onPrev: () => void;
    isActive: boolean;
};
