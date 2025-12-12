'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserConfig, TooltipConfig, TooltipContext, MetricKey } from '@/types/config';
import { DEFAULT_TOOLTIP_CONFIG } from './metrics';

const DEFAULT_USER_CONFIG: UserConfig = {
    tooltips: DEFAULT_TOOLTIP_CONFIG as TooltipConfig,
    showTrends: true,
    compactMode: false,
    animationsEnabled: true,
};

type ConfigContextType = {
    config: UserConfig;
    updateTooltipConfig: (context: TooltipContext, metrics: MetricKey[]) => void;
    updateConfig: (updates: Partial<UserConfig>) => void;
    resetToDefaults: () => void;
};

const ConfigContext = createContext<ConfigContextType | null>(null);

export function ConfigProvider({ children }: { children: ReactNode }) {
    const [config, setConfig] = useState<UserConfig>(DEFAULT_USER_CONFIG);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('mika-config');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setConfig({ ...DEFAULT_USER_CONFIG, ...parsed });
            } catch (e) {
                console.error('Failed to parse saved config', e);
            }
        }
    }, []);

    // Save to localStorage on change
    useEffect(() => {
        localStorage.setItem('mika-config', JSON.stringify(config));
    }, [config]);

    const updateTooltipConfig = (context: TooltipContext, metrics: MetricKey[]) => {
        setConfig(prev => ({
            ...prev,
            tooltips: {
                ...prev.tooltips,
                [context]: metrics,
            },
        }));
    };

    const updateConfig = (updates: Partial<UserConfig>) => {
        setConfig(prev => ({ ...prev, ...updates }));
    };

    const resetToDefaults = () => {
        setConfig(DEFAULT_USER_CONFIG);
    };

    return (
        <ConfigContext.Provider value={{ config, updateTooltipConfig, updateConfig, resetToDefaults }}>
            {children}
        </ConfigContext.Provider>
    );
}

export function useConfig() {
    const context = useContext(ConfigContext);
    if (!context) {
        throw new Error('useConfig must be used within a ConfigProvider');
    }
    return context;
}