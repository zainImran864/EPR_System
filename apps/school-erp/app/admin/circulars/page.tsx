import { DashboardShell } from '@/components/layout/DashboardShell';
import { CircularsView } from '@/modules/circulars/CircularsView';

export default function AdminCircularsPage() {
  return (
    <DashboardShell requiredRole={['ADMIN', 'SUPER_ADMIN']}>
      <CircularsView mode="admin" />
    </DashboardShell>
  );
}
