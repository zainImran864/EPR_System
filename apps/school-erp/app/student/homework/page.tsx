import { DashboardShell } from '@/components/layout/DashboardShell';
import { StudentHomeworkView } from '@/modules/homework/StudentHomeworkView';

export default function StudentHomeworkPage() {
  return (
    <DashboardShell requiredRole={['STUDENT']}>
      <StudentHomeworkView />
    </DashboardShell>
  );
}
