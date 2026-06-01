'use client';

import React, { createContext, useContext, useRef, useState, ReactNode } from 'react';

interface LoadingContextType {
    isLoading: boolean;
    setLoading: (loading: boolean) => void;
    startLoading: () => void;
    stopLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
    const [isLoading, setIsLoading] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const startLoading = () => {
        setIsLoading(true);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            setIsLoading(false);
            timeoutRef.current = null;
        }, 10000);
    };

    const stopLoading = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setIsLoading(false);
    };

    const setLoading = (loading: boolean) => {
        if (loading) {
            startLoading();
            return;
        }
        stopLoading();
    };

    return (
        <LoadingContext.Provider value={{ isLoading, setLoading, startLoading, stopLoading }}>
            {children}
        </LoadingContext.Provider>
    );
}

export function useLoading() {
    const context = useContext(LoadingContext);
    if (context === undefined) {
        throw new Error('useLoading must be used within a LoadingProvider');
    }
    return context;
}
