export interface ClassSection {
  id: string;
  classId: string;
  name: string;
  roomNumber?: string;
  classTeacherId?: string;
  classTeacherName?: string;
  studentCount: number;
}

export interface ClassGrade {
  id: string;
  schoolId: string;
  name: string;
  numericGrade: number;
  academicYear: string;
  totalStudents: number;
  sections: ClassSection[];
}

export interface Subject {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  creditHours?: number;
}
