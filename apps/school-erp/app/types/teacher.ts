import { Status } from "./common";

export interface Teacher {
  id: string;
  schoolId: string;
  userId?: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  email: string;
  phone?: string;
  designation: string;
  department: string;
  status: Status;
  joinDate?: string;
}

export interface CreateTeacherInput {
  firstName: string;
  lastName: string;
  employeeId: string;
  email: string;
  phone?: string;
  designation: string;
  department: string;
}
