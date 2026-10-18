import { DashboardShell } from '@/components/layout/DashboardShell';
import { CircularsView } from '@/modules/circulars/CircularsView';

export default function ParentCircularsPage() {
  return (
    <DashboardShell requiredRole={['PARENT']}>
      <CircularsView mode="parent" />
    </DashboardShell>
  );
}
