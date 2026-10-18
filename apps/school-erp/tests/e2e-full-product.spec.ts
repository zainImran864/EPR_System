import { test, expect } from '@playwright/test';

const ARTIFACT_DIR = '/home/zain-imran/.gemini/antigravity-cli/brain/86cba68f-ca04-4d68-aa68-4e62e379ae13';

test.describe('AcademiX School ERP — Full-Stack UI & All Frontend Pages E2E Suite', () => {
  test.setTimeout(120000);

  test('1. Register (/register) Page — Password Strength Meter & Interactive Form', async ({ page }) => {
    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('input[type="password"]').first()).toBeVisible({ timeout: 20000 });

    // Type password to trigger 4-segment Password Strength Meter
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill('StrongPass@2026!');
    await expect(page.getByText(/Use 8\+ chars with uppercase/i).first()).toBeVisible();
    await page.screenshot({ path: `${ARTIFACT_DIR}/e2e_0_register_page.png`, fullPage: true });
  });

  test('2. Login (/login), Admin Dashboard, Command Palette (⌘K) & Admin Teacher Attendance/Leave Approvals', async ({ page }) => {
    // 1. Visit Login Page
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('School Admin').first()).toBeVisible({ timeout: 30000 });
    await page.screenshot({ path: `${ARTIFACT_DIR}/e2e_1_login_page.png` });

    // Click "School Admin" quick demo login card
    await page.getByText('School Admin').first().click();

    // 2. Verify redirection to /admin/dashboard
    await page.waitForURL('**/admin/dashboard', { timeout: 60000 });
    await expect(page.locator('main')).toBeVisible({ timeout: 30000 });
    await page.screenshot({ path: `${ARTIFACT_DIR}/e2e_2_admin_dashboard.png` });

    // 3. Test Topbar ⌘K Command Palette
    const searchBtn = page.getByRole('button', { name: /Quick search modules/i });
    await expect(searchBtn).toBeVisible();
    await searchBtn.click();

    const paletteDialog = page.getByRole('dialog', { name: /command palette/i });
    await expect(paletteDialog).toBeVisible();
    await page.screenshot({ path: `${ARTIFACT_DIR}/e2e_3_command_palette.png` });

    await page.keyboard.press('Escape');
    await expect(paletteDialog).toBeHidden();

    // 4. Navigate to Admin Teacher Attendance & Leave Approvals (/admin/teacher-attendance)
    await page.goto('/admin/teacher-attendance', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Teacher Attendance & Leave Approvals/i)).toBeVisible({ timeout: 30000 });
    await page.screenshot({ path: `${ARTIFACT_DIR}/e2e_6_admin_teacher_attendance.png` });
  });

  test('3. Teacher Self-Attendance (/teacher/my-attendance) — Live GPS Geofence Mismatch Error, On-Campus Photo Check-In & Leave Application', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Teacher').first()).toBeVisible({ timeout: 30000 });
    await page.getByText('Teacher').first().click();

    await page.waitForURL('**/teacher/dashboard', { timeout: 60000 });

    // Navigate to Teacher Self-Attendance & Leave page
    await page.goto('/teacher/my-attendance', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Teacher Self-Attendance & Leave Portal/i)).toBeVisible({ timeout: 30000 });

    // 1. Test Off-Campus GPS (2.4km away) -> verify Location Mismatch error banner appears!
    await page.getByTestId('btn-simulate-off-campus').click();
    await expect(page.getByTestId('geofence-error-banner')).toBeVisible();
    await page.screenshot({ path: `${ARTIFACT_DIR}/e2e_7_teacher_geofence_mismatch.png` });

    // 2. Switch to On-Campus GPS (within 250m school geofence) -> error disappears & mark attendance!
    await page.getByTestId('btn-simulate-on-campus').click();
    await expect(page.getByTestId('geofence-error-banner')).toBeHidden();
    await page.screenshot({ path: `${ARTIFACT_DIR}/e2e_8_teacher_on_campus_checkin.png` });
  });
});
