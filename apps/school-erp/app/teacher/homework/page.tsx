import { DashboardShell } from '@/components/layout/DashboardShell';
import { TeacherHomeworkView } from '@/modules/homework/TeacherHomeworkView';

export default function TeacherHomeworkPage() {
  return (
    <DashboardShell requiredRole={['TEACHER', 'ADMIN', 'SUPERADMIN']}>
      <TeacherHomeworkView />
    </DashboardShell>
  );
}
