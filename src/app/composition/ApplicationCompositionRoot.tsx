import { WorkManagementDesignSystemProvider } from '../../design-system/index.ts';
import { WorkManagementQueryProvider } from './WorkManagementQueryProvider.tsx';
import { WorkManagementShell } from '../shell/WorkManagementShell.tsx';

export function ApplicationCompositionRoot() {
  return (
    <WorkManagementQueryProvider>
      <WorkManagementDesignSystemProvider>
        <WorkManagementShell />
      </WorkManagementDesignSystemProvider>
    </WorkManagementQueryProvider>
  );
}
