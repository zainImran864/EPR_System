import { DashboardShell } from '@/components/layout/DashboardShell';
import { StudentAchievementsView } from '@/modules/students/StudentAchievementsView';

export default function ParentAchievementsPage() {
  return (
    <DashboardShell requiredRole={['PARENT']}>
      <StudentAchievementsView isParent={true} />
    </DashboardShell>
  );
}
