"use client";

import { Provider } from 'jotai';
import React from 'react';

interface FlipbookProvidersProps {
  children: React.ReactNode;
}

export function FlipbookProviders({ children }: FlipbookProvidersProps) {
  return (
    <Provider>
      {children}
    </Provider>
  );
}