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

const DEMO_ACCOUNT_PASSWORDS: Record<string, string> = {
  'superadmin@academix.com': 'SuperAdmin@123',
  'admin@oakridge.edu': 'Admin@123',
  'sarah@oakridge.edu': 'Teacher@123',
  'alice@oakridge.edu': 'Student@123',
  'robert.parent@oakridge.edu': 'Parent@123',
};

let refreshPromise: Promise<string | null> | null = null;

async function trySilentTokenUpgrade(baseUrl: string): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const currentToken =
        localStorage.getItem('erp_session_token') ||
        localStorage.getItem('auth_token') ||
        '';
      let email = '';
      if (currentToken.startsWith('seed_token_')) {
        email = currentToken.replace('seed_token_', '').trim().toLowerCase();
      }
      if (!email) {
        const rawUser = localStorage.getItem('erp_session_user');
        if (rawUser) {
          const parsed = JSON.parse(rawUser);
          email = (parsed?.email || '').trim().toLowerCase();
        }
      }

      const password = DEMO_ACCOUNT_PASSWORDS[email];
      if (!email || !password) return null;

      const loginUrl = `${baseUrl.replace(/\/$/, '')}/auth/login`;
      const res = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) return null;

      const body = await res.json().catch(() => null);
      const payload = body?.data ?? body;
      const newToken = payload?.accessToken || payload?.token;
      if (newToken && typeof newToken === 'string') {
        localStorage.setItem('erp_session_token', newToken);
        localStorage.setItem('auth_token', newToken);
        return newToken;
      }
      return null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const token =
      localStorage.getItem('erp_session_token') ||
      localStorage.getItem('auth_token');
    if (token && !token.startsWith('seed_token_')) {
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

  // Proactively upgrade offline seed_token_* before sending authenticated requests
  if (
    typeof window !== 'undefined' &&
    !endpoint.includes('/auth/login') &&
    (localStorage.getItem('erp_session_token') || '').startsWith('seed_token_')
  ) {
    await trySilentTokenUpgrade(baseUrl);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers as Record<string, string>),
  };

  try {
    let response = await fetch(url, {
      ...options,
      headers,
    });

    // If 401 Unauthorized, try silent JWT upgrade once and retry
    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      const upgradedToken = await trySilentTokenUpgrade(baseUrl);
      if (upgradedToken) {
        response = await fetch(url, {
          ...options,
          headers: {
            ...headers,
            Authorization: `Bearer ${upgradedToken}`,
          },
        });
      }
    }

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
  getClassTimetable: (classId: string) =>
    apiClient.get<any[]>(`/timetable/class/${classId}`),
  getTeacherTimetable: (teacherId: string) =>
    apiClient.get<any[]>(`/timetable/teacher/${teacherId}`),
  getStudentTimetable: (studentId: string) =>
    apiClient.get<any>(`/timetable/student/${studentId}`),
  createEntry: (data: {
    sectionId: string;
    subjectId?: string;
    subjectName?: string;
    teacherId?: string;
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
  updateClass: (id: string, data: any) => apiClient.patch<any>(`/classes/${id}`, data),
  createSection: (data: { classId: string; name: string; room?: string; capacity?: number; classTeacherId?: string }) =>
    apiClient.post<any>('/classes/sections', data),
  updateSection: (id: string, data: { name?: string; room?: string; capacity?: number; classTeacherId?: string | null }) =>
    apiClient.patch<any>(`/classes/sections/${id}`, data),
  deleteSection: (id: string) => apiClient.delete<any>(`/classes/sections/${id}`),
  createSubject: (data: any) => apiClient.post<any>('/classes/subjects', data),
};

export const attendanceRestApi = {
  getByDate: (date: string, sectionId?: string) =>
    apiClient.get<any[]>('/attendance', { date, sectionId }),
  recordBulk: (data: { sectionId: string; date: string; records: any[] }) =>
    apiClient.post<any>('/attendance/bulk', data),
  getStudentHistory: (studentId: string) =>
    apiClient.get<any>(`/attendance/student/${studentId}`),
  // Teacher Self-Attendance & Leave Management
  getTeacherContext: () => apiClient.get<any>('/attendance/teacher/context'),
  checkInTeacher: (data: {
    date?: string;
    photoUrl: string;
    latitude: number;
    longitude: number;
    addressLabel?: string;
    status?: string;
    remarks?: string;
  }) => apiClient.post<any>('/attendance/teacher/check-in', data),
  getTeacherRecords: (date?: string) =>
    apiClient.get<any>('/attendance/teacher/records', date ? { date } : undefined),
  updateSchoolLocation: (data: {
    latitude: number;
    longitude: number;
    geofenceRadiusMeters?: number;
    address?: string;
  }) => apiClient.patch<any>('/attendance/teacher/school-location', data),
  applyLeave: (data: {
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
  }) => apiClient.post<any>('/attendance/teacher/leaves', data),
  listLeaves: (status?: string) =>
    apiClient.get<any[]>('/attendance/teacher/leaves', status ? { status } : undefined),
  reviewLeave: (
    id: string,
    data: { status: 'APPROVED' | 'REJECTED'; adminRemarks?: string },
  ) => apiClient.patch<any>(`/attendance/teacher/leaves/${id}/review`, data),
  purgeOldPhotos: () =>
    apiClient.post<any>('/attendance/teacher/purge-old-photos'),
  createQrSession: (mode: 'TEACHER_CHECKIN' | 'ADMIN_SET_LOCATION') =>
    apiClient.post<any>('/attendance/teacher/qr-session', { mode }),
  getQrSession: (sessionId: string) =>
    apiClient.get<any>(`/attendance/teacher/qr-session/${sessionId}`),
  submitQrSession: (
    sessionId: string,
    data: {
      latitude: number;
      longitude: number;
      photoUrl?: string;
      geofenceRadiusMeters?: number;
      address?: string;
      remarks?: string;
    },
  ) => apiClient.post<any>(`/attendance/teacher/qr-session/${sessionId}/submit`, data),
  applyStudentLeave: (data: {
    studentId: string;
    startDate: string;
    endDate: string;
    reason: string;
    attachmentUrl?: string;
  }) => apiClient.post<any>('/attendance/student/leaves', data),
  listStudentLeaves: (status?: string) =>
    apiClient.get<any[]>('/attendance/student/leaves', status ? { status } : undefined),
  reviewStudentLeave: (id: string, data: { status: 'APPROVED' | 'REJECTED'; reviewRemarks?: string }) =>
    apiClient.patch<any>(`/attendance/student/leaves/${id}/review`, data),
};

export const parentRestApi = {
  getChildren: () => apiClient.get<any[]>('/auth/parent/children'),
  switchChild: (studentId: string) => apiClient.post<any>(`/auth/parent/switch-child/${studentId}`),
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
  getLateFeePolicy: () => apiClient.get<any>('/fees/late-fee-policy'),
  setLateFeePolicy: (lateFeeAmount: number) =>
    apiClient.patch<any>('/fees/late-fee-policy', { lateFeeAmount }),
  checkOverdue: () => apiClient.post<any>('/fees/check-overdue'),
  getStructures: () => apiClient.get<any[]>('/fees/structures'),
  createStructure: (data: any) => apiClient.post<any>('/fees/structures', data),
  getChallans: (params?: any) => apiClient.get<any[]>('/fees/challans', params),
  getChallanById: (id: string) => apiClient.get<any>(`/fees/challans/${id}`),
  createChallan: (data: any) => apiClient.post<any>('/fees/challans', data),
  generateMonthly: (data: {
    classId?: string;
    sectionId?: string;
    studentId?: string;
    discountPercentage?: number;
    discountAmount?: number;
    title: string;
    month: string;
    academicYear: string;
    dueDate: string;
    amount: number;
    fineAmount?: number;
    lateFeeAmount?: number;
    applyStudentDiscounts?: boolean;
  }) => apiClient.post<any>('/fees/challans/bulk', data),
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
  markAllAsRead: () => apiClient.post<any>('/notifications/read-all'),
  clearAll: () => apiClient.post<any>('/notifications/clear-all'),
  broadcast: (data: any) => apiClient.post<any>('/notifications/broadcast', data),
};

export const expensesRestApi = {
  getAll: (query?: {
    month?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    academicYear?: string;
  }) =>
    apiClient.get<{ expenses: any[]; totalAmount: number; count: number }>(
      '/expenses',
      query,
    ),
  getById: (id: string) => apiClient.get<any>(`/expenses/${id}`),
  create: (data: {
    title: string;
    category: string;
    amount: number;
    expenseDate?: string;
    month?: string;
    academicYear?: string;
    paymentMethod?: string;
    recipientName?: string;
    invoiceNumber?: string;
    receiptUrl?: string;
    remarks?: string;
  }) => apiClient.post<any>('/expenses', data),
  update: (id: string, data: any) => apiClient.patch<any>(`/expenses/${id}`, data),
  delete: (id: string) => apiClient.delete<any>(`/expenses/${id}`),
  getTracking: (query?: {
    rangeType?: 'monthly' | 'yearly' | 'custom';
    month?: string;
    year?: string;
    startDate?: string;
    endDate?: string;
  }) => apiClient.get<any>('/expenses/tracking', query),
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

export const backupRestApi = {
  getStatus: () => apiClient.get<any>('/backup/status'),
  triggerNow: () => apiClient.post<any>('/backup/now'),
  updateConfig: (data: {
    autoBackupEnabled?: boolean;
    backupScheduleTime?: string;
    backupFrequency?: string;
  }) => apiClient.patch<any>('/backup/config', data),
  getDownloadUrl: (filename: string) => `${getApiBaseUrl()}/backup/download/${filename}`,
};

export const circularsRestApi = {
  list: (params?: { targetType?: string; classId?: string; sectionId?: string }) =>
    apiClient.get<any[]>('/circulars', params),
  getById: (id: string) => apiClient.get<any>(`/circulars/${id}`),
  create: (data: {
    title: string;
    content: string;
    targetType: string;
    classId?: string;
    sectionId?: string;
    attachmentUrl?: string;
    isPinned?: boolean;
  }) => apiClient.post<any>('/circulars', data),
  delete: (id: string) => apiClient.delete<any>(`/circulars/${id}`),
};

export const homeworkRestApi = {
  list: (params?: { classId?: string; sectionId?: string; subjectId?: string }) =>
    apiClient.get<any[]>('/homework', params),
  getById: (id: string) => apiClient.get<any>(`/homework/${id}`),
  create: (data: {
    classId: string;
    sectionId: string;
    subjectId: string;
    title: string;
    description: string;
    dueDate: string;
    maxMarks?: number;
    attachmentUrl?: string;
  }) => apiClient.post<any>('/homework', data),
  submit: (homeworkId: string, data: { submissionUrl?: string; content?: string }) =>
    apiClient.post<any>(`/homework/${homeworkId}/submit`, data),
  grade: (submissionId: string, data: { marksObtained: number; feedback?: string }) =>
    apiClient.patch<any>(`/homework/submission/${submissionId}/grade`, data),
  delete: (id: string) => apiClient.delete<any>(`/homework/${id}`),
};

export const ptmRestApi = {
  list: (params?: { status?: string; studentId?: string }) =>
    apiClient.get<any[]>('/parent-meetings', params),
  create: (data: {
    studentId: string;
    teacherId?: string;
    meetingDate: string;
    timeSlot: string;
    mode?: string;
    agenda: string;
    notes?: string;
  }) => apiClient.post<any>('/parent-meetings', data),
  updateStatus: (id: string, data: { status: string; notes?: string }) =>
    apiClient.patch<any>(`/parent-meetings/${id}/status`, data),
};



