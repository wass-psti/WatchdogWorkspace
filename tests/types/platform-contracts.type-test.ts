import type { PlatformRole, Capability, ModuleAccessDecisionInput } from '../../src/types/auth.ts';
import type { ApplicationManifest } from '../../src/types/manifest.ts';
import type { QueryClient } from '../../src/platform/contracts/query.ts';
import type { BackendClient } from '../../src/platform/contracts/transport.ts';
import type { SupabaseClientAdapter } from '../../src/platform/contracts/supabase-client.ts';
import type { BoardRepository } from '../../src/features/boards/contracts/repository.ts';
import type { BoardColumn, StatusColumnConfig } from '../../src/features/boards/contracts/domain.ts';
import { parseStatusColumnConfig } from '../../src/features/boards/contracts/status-schema.ts';
import { capabilityPolicy } from '../../assets/js/platform/auth/permissions.ts';

const role: PlatformRole = 'employee';
const capability: Capability = 'board.view';
const access: ModuleAccessDecisionInput = {
  authenticated: true,
  accountActive: true,
  platformRole: role,
  assignments: [],
  moduleId: 'time-tracker',
};
void capability;
void access;

declare const queries: QueryClient;
declare const backend: BackendClient;
declare const supabase: SupabaseClientAdapter;
declare const boards: BoardRepository;
void queries;
void backend;
void supabase;
supabase.project.supabaseUrl satisfies string;
supabase.rpc<{ readonly ok: true }>('wm_health', {}, 'access-token') satisfies Promise<{ readonly ok: true }>;
void boards;

const statusConfig: StatusColumnConfig = {
  labels: [
    { id: 'not_started', name: 'Not started', color: '#7f8a9a', active: true, description: '', position: 0 },
    { id: 'done', name: 'Done', color: '#23b784', active: true, description: '', position: 1 },
  ],
  default_label_id: 'not_started',
};
parseStatusColumnConfig(statusConfig);

const statusColumn: BoardColumn = {
  id: 'column-status',
  board_id: 'board-1',
  name: 'Status',
  data_type: 'status',
  config: statusConfig,
  position: 0,
  visible: true,
  system_key: 'status',
};
if (statusColumn.data_type === 'status') {
  const firstLabel = statusColumn.config.labels[0];
  if (firstLabel) firstLabel.id satisfies string;
}

declare const manifest: ApplicationManifest;
manifest.runtime satisfies 'vite-esm';
if (manifest.architecture.supabaseClientAdapter) manifest.architecture.supabaseClientAdapter satisfies 'work-management-supabase-client-adapter-v1';
if (manifest.architecture.serverStateLibrary) manifest.architecture.serverStateLibrary satisfies 'tanstack-query-v5';

capabilityPolicy.platform.admin_general_manager satisfies readonly Capability[];
capabilityPolicy.board.owner satisfies readonly Capability[];
