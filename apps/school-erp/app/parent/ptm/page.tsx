import { DashboardShell } from '@/components/layout/DashboardShell';
import { ParentTeacherMeetingView } from '@/modules/ptm/ParentTeacherMeetingView';

export default function ParentPtmPage() {
  return (
    <DashboardShell requiredRole={['PARENT']}>
      <ParentTeacherMeetingView />
    </DashboardShell>
  );
}
