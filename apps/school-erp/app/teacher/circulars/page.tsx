import { DashboardShell } from '@/components/layout/DashboardShell';
import { CircularsView } from '@/modules/circulars/CircularsView';

export default function TeacherCircularsPage() {
  return (
    <DashboardShell requiredRole={['TEACHER']}>
      <CircularsView mode="teacher" />
    </DashboardShell>
  );
}
