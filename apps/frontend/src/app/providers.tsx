'use client';

import { ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PrimeReactProvider } from 'primereact/api';
import { LoadingProvider } from '@/contexts/LoadingContext';
import GlobalLoader from '@/components/GlobalLoader';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <PrimeReactProvider>
        <LoadingProvider>
          <GlobalLoader />
          {children}
        </LoadingProvider>
      </PrimeReactProvider>
    </QueryClientProvider>
  );
}

