import { DashboardShell } from '@/components/layout/DashboardShell';
import { ParentTeacherMeetingView } from '@/modules/ptm/ParentTeacherMeetingView';

export default function TeacherPtmPage() {
  return (
    <DashboardShell requiredRole={['TEACHER', 'ADMIN', 'SUPERADMIN']}>
      <ParentTeacherMeetingView />
    </DashboardShell>
  );
}
