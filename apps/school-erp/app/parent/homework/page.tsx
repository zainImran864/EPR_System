import { DashboardShell } from '@/components/layout/DashboardShell';
import { StudentHomeworkView } from '@/modules/homework/StudentHomeworkView';

export default function ParentHomeworkPage() {
  return (
    <DashboardShell requiredRole={['PARENT']}>
      <StudentHomeworkView isParent={true} />
    </DashboardShell>
  );
}
