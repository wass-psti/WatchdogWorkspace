import type { ReactNode } from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { workManagementSystem } from './system.ts';

export interface WorkManagementDesignSystemProviderProps {
  readonly children: ReactNode;
}

/** Product-owned provider. Feature modules must never import ChakraProvider directly. */
export function WorkManagementDesignSystemProvider({ children }: WorkManagementDesignSystemProviderProps) {
  return <ChakraProvider value={workManagementSystem}>{children}</ChakraProvider>;
}
