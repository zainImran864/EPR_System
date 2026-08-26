export interface ExamTerm {
  id: string;
  name: string;
  term: string;
  startDate: string;
  endDate: string;
  academicYear: string;
  isPublished: boolean;
}

export interface StudentMarkRow {
  studentId: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  admissionNumber?: string;
  subjectId?: string;
  totalMarks: number;
  obtainedMarks: number;
  grade: string;
  remarks?: string;
  isRecorded?: boolean;
}
