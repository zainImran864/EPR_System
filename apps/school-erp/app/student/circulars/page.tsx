import { DashboardShell } from '@/components/layout/DashboardShell';
import { CircularsView } from '@/modules/circulars/CircularsView';

export default function StudentCircularsPage() {
  return (
    <DashboardShell requiredRole={['STUDENT']}>
      <CircularsView mode="student" />
    </DashboardShell>
  );
}
