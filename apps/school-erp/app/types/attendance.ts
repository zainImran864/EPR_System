export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export interface AttendanceRecord {
  id?: string;
  studentId: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  admissionNumber?: string;
  status: AttendanceStatus;
  remarks?: string;
  isRecorded?: boolean;
}

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  percentage?: number;
}
