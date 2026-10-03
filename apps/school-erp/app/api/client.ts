/**
 * Typed client API requester for AcademiX School ERP.
 * Connects directly to the NestJS backend and handles auth tokens & JSON serialization.
 */

function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol || 'http:';
    const hostname = window.location.hostname || '127.0.0.1';
    return `${protocol}//${hostname}:3001/api`;
  }
  return 'http://127.0.0.1:3001/api';
}

export interface ApiResponse<T = any> {
  statusCode: number;
  success: boolean;
  data: T;
  timestamp: string;
}

export class ApiError extends Error {
  statusCode: number;
  data: any;

  constructor(message: string, statusCode: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const token =
      localStorage.getItem('erp_session_token') ||
      localStorage.getItem('auth_token');
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  } catch {}
  return {};
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers as Record<string, string>),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg =
        data?.error?.message ||
        data?.message ||
        `Request failed with status ${response.status}`;
      throw new ApiError(
        typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg),
        response.status,
        data,
      );
    }

    // Unpack TransformInterceptor envelope if present
    if (data && typeof data === 'object' && 'data' in data && 'success' in data) {
      return data.data as T;
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError((error as Error).message || 'Network error', 500);
  }
}

export const apiClient = {
  get: <T>(endpoint: string, params?: Record<string, any>) => {
    let url = endpoint;
    if (params) {
      const query = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') {
          query.append(k, String(v));
        }
      }
      const qs = query.toString();
      if (qs) url += `?${qs}`;
    }
    return request<T>(url, { method: 'GET' });
  },

  post: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Typed REST Domain Services
// ─────────────────────────────────────────────────────────────────────────────

export const authRestApi = {
  login: (credentials: { email: string; password: string; schoolCode?: string }) =>
    apiClient.post<{ accessToken: string; user: any }>('/auth/login', credentials),
  me: () => apiClient.get<any>('/auth/me'),
  logout: () => apiClient.post<{ success: boolean }>('/auth/logout'),
  registerSchool: (data: any) =>
    apiClient.post<{ message: string; schoolId: string; adminEmail: string }>('/auth/register-school', data),
  changePassword: (data: { oldPassword?: string; newPassword?: string }) =>
    apiClient.post<{ success: boolean }>('/auth/change-password', data),
  updateTheme: (themeColor: string) =>
    apiClient.patch<{ success: boolean }>('/auth/theme', { themeColor }),
  generate2FA: () => apiClient.post<{ secret: string; otpauthUrl: string; qrCodeUri?: string }>('/auth/2fa/generate'),
  enable2FA: (code: string) => apiClient.post<{ success: boolean }>('/auth/2fa/enable', { code }),
  disable2FA: (code: string) => apiClient.post<{ success: boolean }>('/auth/2fa/disable', { code }),
};

export const timetableRestApi = {
  getMyTimetable: () => apiClient.get<any>('/timetable/my'),
  getSectionTimetable: (sectionId: string) =>
    apiClient.get<any[]>(`/timetable/section/${sectionId}`),
  getTeacherTimetable: (teacherId: string) =>
    apiClient.get<any[]>(`/timetable/teacher/${teacherId}`),
  getStudentTimetable: (studentId: string) =>
    apiClient.get<any>(`/timetable/student/${studentId}`),
  createEntry: (data: {
    sectionId: string;
    subjectId: string;
    teacherId: string;
    dayOfWeek: string;
    periodNumber: number;
    startTime: string;
    endTime: string;
    room?: string;
    allowCombinedClass?: boolean;
    allowSharedRoom?: boolean;
  }) => apiClient.post<any>('/timetable/entry', data),
  deleteEntry: (id: string) => apiClient.delete<{ success: boolean }>(`/timetable/entry/${id}`),
};

export const schoolsRestApi = {
  getCurrentSchool: () => apiClient.get<any>('/schools/current'),
  updateSchool: (data: any) => apiClient.patch<any>('/schools/current', data),
  getSmtpSettings: () => apiClient.get<any>('/schools/current/smtp'),
  updateSmtpSettings: (data: {
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
    smtpFrom?: string;
    smtpSecure?: boolean;
    smtpEnabled?: boolean;
  }) => apiClient.patch<{ success: boolean; message: string }>('/schools/current/smtp', data),
  testSmtp: (data: {
    toEmail: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
    smtpFrom?: string;
    smtpSecure?: boolean;
  }) => apiClient.post<{ success: boolean; message: string }>('/schools/current/smtp/test', data),
};

export const studentsRestApi = {
  getAll: (params?: { classId?: string; sectionId?: string; status?: string; search?: string }) =>
    apiClient.get<any[]>('/students', params),
  getById: (id: string) => apiClient.get<any>(`/students/${id}`),
  create: (data: any) => apiClient.post<any>('/students', data),
  update: (id: string, data: any) => apiClient.patch<any>(`/students/${id}`, data),
  delete: (id: string) => apiClient.delete<any>(`/students/${id}`),
  promote: (id: string, data?: { targetClassId?: string; targetSectionId?: string }) =>
    apiClient.post<{ success: boolean; message: string; student: any }>(`/students/${id}/promote`, data || {}),
  demote: (id: string, data?: { targetClassId?: string; targetSectionId?: string }) =>
    apiClient.post<{ success: boolean; message: string; student: any }>(`/students/${id}/demote`, data || {}),
  autoProgress: (data: { finalExamTermId: string; passingThreshold?: number; autoPromotePassing?: boolean }) =>
    apiClient.post<any>('/students/auto-progression', data),
  applyProgressionDecisions: (decisions: any[]) =>
    apiClient.post<any>('/students/apply-decisions', { decisions }),
};

export const teachersRestApi = {
  getAll: () => apiClient.get<any[]>('/teachers'),
  getById: (id: string) => apiClient.get<any>(`/teachers/${id}`),
  create: (data: any) => apiClient.post<any>('/teachers', data),
  update: (id: string, data: any) => apiClient.patch<any>(`/teachers/${id}`, data),
  delete: (id: string) => apiClient.delete<any>(`/teachers/${id}`),
};

export const classesRestApi = {
  getAll: () => apiClient.get<any[]>('/classes'),
  createClass: (data: any) => apiClient.post<any>('/classes', data),
  createSection: (classId: string, data: any) =>
    apiClient.post<any>(`/classes/${classId}/sections`, data),
  createSubject: (data: any) => apiClient.post<any>('/classes/subjects', data),
};

export const attendanceRestApi = {
  getByDate: (date: string, sectionId?: string) =>
    apiClient.get<any[]>('/attendance', { date, sectionId }),
  recordBulk: (data: { sectionId: string; date: string; records: any[] }) =>
    apiClient.post<any>('/attendance/bulk', data),
  getStudentHistory: (studentId: string) =>
    apiClient.get<any>(`/attendance/student/${studentId}`),
};

export const marksRestApi = {
  getTeacherContext: () => apiClient.get<any>('/marks/teacher-context'),
  getExams: () => apiClient.get<any[]>('/marks/exam-terms'),
  createExam: (data: any) => apiClient.post<any>('/marks/exam-terms', data),
  savePaperSchedules: (data: { examTermId: string; classId: string; schedules: any[] }) =>
    apiClient.post<any>('/marks/paper-schedules', data),
  getPaperSchedules: (examTermId: string, classId: string) =>
    apiClient.get<any[]>('/marks/paper-schedules', { examTermId, classId }),
  getRollNoSlips: (examTermId: string, classId: string, sectionId?: string) =>
    apiClient.get<any[]>('/marks/roll-no-slips', { examTermId, classId, sectionId }),
  getSingleRollNoSlip: (studentId: string, examTermId: string, isRetake?: boolean) =>
    apiClient.get<any>(`/marks/roll-no-slip/${studentId}`, { examTermId, isRetake: isRetake ? 'true' : 'false' }),
  getMarks: (examId: string, subjectId?: string, sectionId?: string) =>
    apiClient.get<any[]>('/marks/section-marks', { examTermId: examId, subjectId, sectionId }),
  submitBulk: (data: { examTermId: string; subjectId: string; entries: any[] }) =>
    apiClient.post<any>('/marks/save', data),
  getStudentReportCard: (studentId: string, examTermId?: string) =>
    apiClient.get<any>(`/marks/report-card/${studentId}`, examTermId ? { examTermId } : undefined),
  getExamAnalytics: (examTermId: string, sectionId?: string) =>
    apiClient.get<any>('/marks/analytics', { examTermId, sectionId }),
  getBatchReportCards: (examTermId: string, sectionId: string) =>
    apiClient.get<any[]>('/marks/batch-report-cards', { examTermId, sectionId }),
  getQuestionPapers: (params?: { examTermId?: string; classId?: string; subjectId?: string }) =>
    apiClient.get<any[]>('/marks/question-papers', params),
  createQuestionPaper: (data: any) =>
    apiClient.post<any>('/marks/question-papers', data),
  setActiveQuestionPaper: (id: string) =>
    apiClient.patch<any>(`/marks/question-papers/${id}/set-active`, {}),
  deleteQuestionPaper: (id: string) =>
    apiClient.delete<any>(`/marks/question-papers/${id}`),
  getPrintableQuestionPaper: (id: string) =>
    apiClient.get<any>(`/marks/question-paper/print/${id}`),
};

export const feesRestApi = {
  getStructures: () => apiClient.get<any[]>('/fees/structures'),
  createStructure: (data: any) => apiClient.post<any>('/fees/structures', data),
  getChallans: (params?: any) => apiClient.get<any[]>('/fees/challans', params),
  createChallan: (data: any) => apiClient.post<any>('/fees/challans', data),
  generateMonthly: (data: { classId?: string; sectionId?: string; title: string; month: string; academicYear: string; dueDate: string; amount: number; applyStudentDiscounts?: boolean }) =>
    apiClient.post<any>('/fees/challans/bulk', data),
  setStudentDiscount: (studentId: string, data: { discountPercentage?: number; customMonthlyFee?: number; discountReason?: string }) =>
    apiClient.patch<any>(`/fees/student-discount/${studentId}`, data),
  payFee: (id: string, data: { paidAmount: number; paymentMethod?: string }) =>
    apiClient.post<any>(`/fees/challans/${id}/pay`, data),
  getStudentLedger: (studentId: string) =>
    apiClient.get<any>(`/fees/student/${studentId}/ledger`),
};

export const notificationsRestApi = {
  getAll: () => apiClient.get<any[]>('/notifications'),
  markAsRead: (id: string) => apiClient.patch<any>(`/notifications/${id}/read`),
  broadcast: (data: any) => apiClient.post<any>('/notifications/broadcast', data),
};

export const whatsappRestApi = {
  getRecipients: (search?: string) =>
    apiClient.get<any>('/whatsapp/recipients', search ? { search } : undefined),
  getTemplates: () => apiClient.get<any[]>('/whatsapp/templates'),
  sendDirect: (data: any) => apiClient.post<any>('/whatsapp/send-direct', data),
  sendBatch: (data: any) => apiClient.post<any>('/whatsapp/send-batch', data),
  sendReportCard: (data: { studentId: string; examTermId?: string; customRemarks?: string }) =>
    apiClient.post<any>('/whatsapp/send-report-card', data),
  sendFeeReminder: (data: { challanId: string }) =>
    apiClient.post<any>('/whatsapp/send-fee-reminder', data),
  sendAttendanceAlert: (data: { studentId: string; date: string; status?: string }) =>
    apiClient.post<any>('/whatsapp/send-attendance-alert', data),
};

export const dashboardRestApi = {
  getAdminStats: () => apiClient.get<any>('/dashboard/admin'),
  getTeacherStats: () => apiClient.get<any>('/dashboard/teacher'),
  getStudentStats: () => apiClient.get<any>('/dashboard/student'),
  getSuperAdminStats: () => apiClient.get<any>('/dashboard/superadmin'),
  getStats: () => apiClient.get<any>('/dashboard/admin'),
};

export const superAdminRestApi = {
  getStats: () => apiClient.get<any>('/dashboard/superadmin'),
  getSchools: () => apiClient.get<any[]>('/schools/superadmin/all'),
  getPendingRequests: () => apiClient.get<any[]>('/schools/superadmin/pending-requests'),
  approveRequest: (id: string) =>
    apiClient.post<any>(`/schools/superadmin/requests/${id}/approve`),
  rejectRequest: (id: string, reason?: string) =>
    apiClient.post<any>(`/schools/superadmin/requests/${id}/reject`, { reason }),
};

export const seedApi = {
  seedDemoData: () => apiClient.post<any>('/seed/demo'),
};
