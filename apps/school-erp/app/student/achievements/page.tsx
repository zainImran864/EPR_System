import { DashboardShell } from '@/components/layout/DashboardShell';
import { StudentAchievementsView } from '@/modules/students/StudentAchievementsView';

export default function StudentAchievementsPage() {
  return (
    <DashboardShell requiredRole={['STUDENT']}>
      <StudentAchievementsView />
    </DashboardShell>
  );
}
