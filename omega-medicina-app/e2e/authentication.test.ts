// E2E Tests - Authentication Flow
import { by, device, element, expect, waitFor } from 'detox';

describe('Authentication Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should show welcome screen on app launch', async () => {
    await expect(element(by.id('welcome-screen'))).toBeVisible();
  });

  it('should navigate to login screen', async () => {
    await element(by.id('login-button')).tap();
    await expect(element(by.id('login-screen'))).toBeVisible();
  });

  it('should show login form elements', async () => {
    await expect(element(by.id('email-input'))).toBeVisible();
    await expect(element(by.id('password-input'))).toBeVisible();
    await expect(element(by.id('login-submit-button'))).toBeVisible();
  });

  it('should handle invalid login credentials', async () => {
    await element(by.id('email-input')).typeText('invalid@example.com');
    await element(by.id('password-input')).typeText('wrongpassword');
    await element(by.id('login-submit-button')).tap();

    // Wait for error message to appear
    await waitFor(element(by.id('login-error-message')))
      .toBeVisible()
      .withTimeout(5000);

    await expect(element(by.id('login-error-message'))).toHaveText('Credenciales inválidas');
  });

  it('should login successfully with valid credentials', async () => {
    // Clear previous inputs
    await element(by.id('email-input')).clearText();
    await element(by.id('password-input')).clearText();

    // Enter valid credentials
    await element(by.id('email-input')).typeText('michelelewin@gmail.com');
    await element(by.id('password-input')).typeText('11234567');
    await element(by.id('login-submit-button')).tap();

    // Wait for navigation to role selector
    await waitFor(element(by.id('role-selector-screen')))
      .toBeVisible()
      .withTimeout(10000);

    await expect(element(by.id('role-selector-screen'))).toBeVisible();
  });

  it('should show user name in role selector', async () => {
    await expect(element(by.text('¡Bienvenido, Michel!'))).toBeVisible();
  });

  it('should navigate to patient home after selecting patient role', async () => {
    await element(by.text('Paciente')).tap();

    // Wait for navigation to patient home
    await waitFor(element(by.id('patient-home-screen')))
      .toBeVisible()
      .withTimeout(10000);

    await expect(element(by.id('patient-home-screen'))).toBeVisible();
  });

  it('should display welcome message with user name', async () => {
    await expect(element(by.text('¡Hola, Michel!'))).toBeVisible();
  });

  it('should show health score', async () => {
    await expect(element(by.id('health-score'))).toBeVisible();
  });

  it('should navigate to health screen when health card is pressed', async () => {
    await element(by.text('Registrar Salud')).tap();

    await waitFor(element(by.id('health-screen')))
      .toBeVisible()
      .withTimeout(5000);

    await expect(element(by.id('health-screen'))).toBeVisible();
  });

  it('should navigate back to home from health screen', async () => {
    await element(by.id('back-button')).tap();

    await waitFor(element(by.id('patient-home-screen')))
      .toBeVisible()
      .withTimeout(5000);

    await expect(element(by.id('patient-home-screen'))).toBeVisible();
  });

  it('should logout successfully', async () => {
    // Open role header menu
    await element(by.id('role-header-button')).tap();
    await element(by.text('Cerrar Sesión')).tap();

    // Should navigate back to welcome screen
    await waitFor(element(by.id('welcome-screen')))
      .toBeVisible()
      .withTimeout(5000);

    await expect(element(by.id('welcome-screen'))).toBeVisible();
  });
});
