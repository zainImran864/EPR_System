import { create } from 'zustand';

export type Language = 'en' | 'ur';

export interface Translations {
  [key: string]: {
    en: string;
    ur: string;
  };
}

export const TRANSLATIONS: Translations = {
  // Navigation & Sections
  dashboard: { en: 'Dashboard', ur: 'ڈیش بورڈ' },
  students: { en: 'Students', ur: 'طلباء' },
  classes: { en: 'Classes & Sections', ur: 'کلاسز اور سیکشنز' },
  teachers: { en: 'Faculty & Staff', ur: 'اساتذہ اور عملہ' },
  attendance: { en: 'Attendance', ur: 'حاضری' },
  studentAttendance: { en: 'Student Attendance', ur: 'طلباء کی حاضری' },
  teacherAttendance: { en: 'Teacher Attendance', ur: 'اساتذہ کی حاضری' },
  myAttendance: { en: 'My Attendance', ur: 'میری حاضری' },
  classAttendance: { en: 'Class Attendance', ur: 'کلاس کی حاضری' },
  studentLeaves: { en: 'Student Leaves', ur: 'طلباء کی رخصت' },
  applyLeave: { en: 'Apply Leave', ur: 'رخصت کی درخواست' },
  timetable: { en: 'Timetable', ur: 'ٹائم ٹیبل' },
  myTimetable: { en: 'My Timetable', ur: 'میرا ٹائم ٹیبل' },
  marks: { en: 'Marks & Exams', ur: 'امتحانات اور نمبرات' },
  marksUpload: { en: 'Marks Upload', ur: 'نمبرات کا اندراج' },
  myResults: { en: 'My Results', ur: 'میرے نتائج' },
  results: { en: 'Results', ur: 'نتائج' },
  fees: { en: 'Fees & Challans', ur: 'فیس اور چالان' },
  myFees: { en: 'My Fees', ur: 'میری فیس' },
  expenses: { en: 'Expenses & P&L', ur: 'اخراجات اور نفع نقصان' },
  circulars: { en: 'Circulars & Notices', ur: 'سرکلرز اور اعلانات' },
  homework: { en: 'Homework & Assignments', ur: 'ہوم ورک اور اسائنمنٹس' },
  myHomework: { en: 'My Homework', ur: 'میرا ہوم ورک' },
  ptm: { en: 'Parent-Teacher Meeting', ur: 'والدین اور اساتذہ کی ملاقات' },
  whatsapp: { en: 'WhatsApp Center', ur: 'واٹس ایپ سنٹر' },
  notifications: { en: 'Notifications', ur: 'اطلاعات' },
  settings: { en: 'Settings', ur: 'ترتیبات' },
  schoolSettings: { en: 'School Settings', ur: 'اسکول کی ترتیبات' },

  // Common UI words
  overview: { en: 'Overview', ur: 'جائزہ' },
  academics: { en: 'Academics', ur: 'تعلیمی امور' },
  operations: { en: 'Operations', ur: 'انتظامی امور' },
  finance: { en: 'Finance & Accounts', ur: 'مالیات اور اکاؤنٹس' },
  communication: { en: 'Communication', ur: 'مواصلات' },
  system: { en: 'System', ur: 'سسٹم' },

  search: { en: 'Search...', ur: 'تلاش کریں...' },
  save: { en: 'Save', ur: 'محفوظ کریں' },
  cancel: { en: 'Cancel', ur: 'منسوخ' },
  submit: { en: 'Submit', ur: 'جمع کروائیں' },
  delete: { en: 'Delete', ur: 'حذف کریں' },
  edit: { en: 'Edit', ur: 'ترمیم' },
  view: { en: 'View', ur: 'دیکھیں' },
  filter: { en: 'Filter', ur: 'فلٹر' },
  export: { en: 'Export', ur: 'برآمد کریں' },
  print: { en: 'Print', ur: 'پرنٹ کریں' },
  loading: { en: 'Loading...', ur: 'لوڈ ہو رہا ہے...' },
  activeChild: { en: 'Active Child', ur: 'منتخب بچہ' },
  switchChild: { en: 'Switch Child', ur: 'بچہ تبدیل کریں' },
  language: { en: 'Language', ur: 'زبان' },
  english: { en: 'English', ur: 'English' },
  urdu: { en: 'اردو', ur: 'اردو' },
  role: { en: 'Role', ur: 'عہدہ' },
  status: { en: 'Status', ur: 'حالت' },
  present: { en: 'Present', ur: 'حاضر' },
  absent: { en: 'Absent', ur: 'غیر حاضر' },
  leave: { en: 'On Leave', ur: 'رخصت پر' },
  late: { en: 'Late', ur: 'تاخیر' },
  approved: { en: 'Approved', ur: 'منظور شدہ' },
  rejected: { en: 'Rejected', ur: 'مسترد شدہ' },
  pending: { en: 'Pending', ur: 'زیر التواء' },
  completed: { en: 'Completed', ur: 'مکمل' },
  deadline: { en: 'Deadline', ur: 'آخری تاریخ' },
  maxMarks: { en: 'Max Marks', ur: 'کل نمبر' },
  obtainedMarks: { en: 'Obtained Marks', ur: 'حاصل کردہ نمبر' },
  feedback: { en: 'Feedback', ur: 'آراء' },
  backupNow: { en: 'Backup Database Now', ur: 'ابھی ڈیٹا بیس کا بیک اپ لیں' },
  currency: { en: 'Currency', ur: 'کرنسی' },
  officialHours: { en: 'Official Operating Hours', ur: 'اسکول کے دفتری اوقات' },
  windowOpen: { en: 'Attendance Window Open', ur: 'حاضری کا وقت جاری ہے' },
  windowClosed: { en: 'Attendance Window Closed', ur: 'حاضری کا وقت ختم ہو چکا ہے' },
  logout: { en: 'Log Out', ur: 'لاگ آؤٹ' },
};

interface LanguageState {
  language: Language;
  direction: 'ltr' | 'rtl';
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

export const useLanguageStore = create<LanguageState>((set, get) => {
  // Read initial from localStorage if client
  let initialLang: Language = 'en';
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('academix_user_lang') as Language;
    if (saved === 'ur' || saved === 'en') {
      initialLang = saved;
      document.documentElement.dir = saved === 'ur' ? 'rtl' : 'ltr';
      document.documentElement.lang = saved;
    }
  }

  return {
    language: initialLang,
    direction: initialLang === 'ur' ? 'rtl' : 'ltr',
    setLanguage: (lang: Language) => {
      const dir = lang === 'ur' ? 'rtl' : 'ltr';
      if (typeof window !== 'undefined') {
        localStorage.setItem('academix_user_lang', lang);
        document.documentElement.dir = dir;
        document.documentElement.lang = lang;
      }
      set({ language: lang, direction: dir });
    },
    toggleLanguage: () => {
      const current = get().language;
      const next: Language = current === 'en' ? 'ur' : 'en';
      get().setLanguage(next);
    },
    t: (key: string, fallback?: string) => {
      const lang = get().language;
      const entry = TRANSLATIONS[key];
      if (entry && entry[lang]) {
        return entry[lang];
      }
      return fallback || entry?.en || key;
    },
  };
});
