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
  admissionNumber: string;
  rollNumber: string;
  gender: "male" | "female" | "other";
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string;
  dob?: string;
  bloodGroup?: string;
  address?: string;
}

export interface StudentFilter {
  classId?: string;
  sectionId?: string;
  search?: string;
  status?: Status;
}
