import { DashboardShell } from '@/components/layout/DashboardShell';
import { ParentTeacherMeetingView } from '@/modules/ptm/ParentTeacherMeetingView';

export default function AdminPtmPage() {
  return (
    <DashboardShell requiredRole={['ADMIN', 'SUPERADMIN']}>
      <ParentTeacherMeetingView />
    </DashboardShell>
  );
}
