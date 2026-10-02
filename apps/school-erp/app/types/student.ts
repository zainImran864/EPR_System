import { Status } from "./common";

export interface Student {
  id: string;
  schoolId: string;
  classId: string;
  sectionId: string;
  className?: string;
  sectionName?: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  rollNumber: string;
  dob?: string;
  gender: "male" | "female" | "other";
  bloodGroup?: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string;
  address?: string;
  status: Status;
  enrollmentDate: string;
  attendanceRate?: number;
}

export interface CreateStudentInput {
  classId: string;
  sectionId: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  gender: "male" | "female" | "other";
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string;
  /** Student's own real inbox — receives their login. */
  studentContactEmail?: string;
  dob?: string;
  bloodGroup?: string;
  address?: string;
  /** Single admin-set password shared by the student + parent accounts. */
  password?: string;
}

export interface StudentFilter {
  classId?: string;
  sectionId?: string;
  search?: string;
  status?: Status;
}
