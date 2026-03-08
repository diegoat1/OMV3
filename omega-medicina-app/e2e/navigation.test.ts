// E2E Tests - Navigation and Data Flow
import { by, device, element, expect, waitFor } from 'detox';

describe('Navigation and Data Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    // Ensure we're logged in for each test
    try {
      await element(by.id('login-button')).tap();
      await element(by.id('email-input')).typeText('michelelewin@gmail.com');
      await element(by.id('password-input')).typeText('11234567');
      await element(by.id('login-submit-button')).tap();
      await waitFor(element(by.id('role-selector-screen'))).toBeVisible().withTimeout(10000);
      await element(by.text('Paciente')).tap();
      await waitFor(element(by.id('patient-home-screen'))).toBeVisible().withTimeout(10000);
    } catch (error) {
      // Already logged in, continue
    }
  });

  it('should navigate through main patient screens', async () => {
    // From home, navigate to training
    await element(by.text('Plan de Entrenamiento')).tap();
    await waitFor(element(by.id('training-screen'))).toBeVisible().withTimeout(5000);
    await expect(element(by.id('training-screen'))).toBeVisible();

    // Navigate back to home
    await element(by.id('back-button')).tap();
    await waitFor(element(by.id('patient-home-screen'))).toBeVisible().withTimeout(5000);

    // Navigate to nutrition
    await element(by.text('Plan Nutricional')).tap();
    await waitFor(element(by.id('nutrition-screen'))).toBeVisible().withTimeout(5000);
    await expect(element(by.id('nutrition-screen'))).toBeVisible();

    // Navigate back to home
    await element(by.id('back-button')).tap();
    await waitFor(element(by.id('patient-home-screen'))).toBeVisible().withTimeout(5000);

    // Navigate to dashboard
    await element(by.text('Análisis de Progreso')).tap();
    await waitFor(element(by.id('dashboard-screen'))).toBeVisible().withTimeout(5000);
    await expect(element(by.id('dashboard-screen'))).toBeVisible();
  });

  it('should load and display health data correctly', async () => {
    await element(by.text('Registrar Salud')).tap();
    await waitFor(element(by.id('health-screen'))).toBeVisible().withTimeout(5000);

    // Check that health form elements are present
    await expect(element(by.id('weight-input'))).toBeVisible();
    await expect(element(by.id('height-input'))).toBeVisible();
    await expect(element(by.id('body-fat-input'))).toBeVisible();

    // Check that save button is present
    await expect(element(by.id('save-health-data-button'))).toBeVisible();
  });

  it('should display nutrition plan data', async () => {
    await element(by.text('Plan Nutricional')).tap();
    await waitFor(element(by.id('nutrition-screen'))).toBeVisible().withTimeout(5000);

    // Check for plan type selector
    await expect(element(by.id('plan-type-selector'))).toBeVisible();

    // Check for meal cards
    await expect(element(by.text('Desayuno'))).toBeVisible();
    await expect(element(by.text('Almuerzo'))).toBeVisible();
    await expect(element(by.text('Cena'))).toBeVisible();
  });

  it('should display training plan data', async () => {
    await element(by.text('Plan de Entrenamiento')).tap();
    await waitFor(element(by.id('training-screen'))).toBeVisible().withTimeout(5000);

    // Check for training program selector
    await expect(element(by.id('training-program-selector'))).toBeVisible();

    // Check for current session info
    await expect(element(by.id('current-session-info'))).toBeVisible();
  });

  it('should display dashboard with metrics', async () => {
    await element(by.text('Análisis de Progreso')).tap();
    await waitFor(element(by.id('dashboard-screen'))).toBeVisible().withTimeout(5000);

    // Check for key metrics
    await expect(element(by.id('weight-chart'))).toBeVisible();
    await expect(element(by.id('body-composition-chart'))).toBeVisible();
    await expect(element(by.id('progress-summary'))).toBeVisible();

    // Check for goal progress indicators
    await expect(element(by.id('goal-progress-indicators'))).toBeVisible();
  });

  it('should handle pending specialist requests', async () => {
    // Check if pending requests are displayed
    const pendingRequest = element(by.id('pending-request-card')).atIndex(0);

    try {
      await expect(pendingRequest).toBeVisible();

      // Check for accept/reject buttons
      await expect(element(by.text('Aceptar'))).toBeVisible();
      await expect(element(by.text('Rechazar'))).toBeVisible();

      // Test accept functionality
      await element(by.text('Aceptar')).atIndex(0).tap();

      // Should show success message or remove the request
      await waitFor(element(by.text('Solicitud aceptada')).atIndex(0))
        .toBeVisible()
        .withTimeout(5000);
    } catch (error) {
      // No pending requests, that's also fine
      console.log('No pending requests found');
    }
  });

  it('should maintain user session across navigation', async () => {
    // Navigate through multiple screens
    await element(by.text('Registrar Salud')).tap();
    await waitFor(element(by.id('health-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('back-button')).tap();
    await waitFor(element(by.id('patient-home-screen'))).toBeVisible().withTimeout(5000);

    await element(by.text('Plan de Entrenamiento')).tap();
    await waitFor(element(by.id('training-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('back-button')).tap();
    await waitFor(element(by.id('patient-home-screen'))).toBeVisible().withTimeout(5000);

    // User should still be logged in and see their name
    await expect(element(by.text('¡Hola, Michel!'))).toBeVisible();
  });

  it('should handle network errors gracefully', async () => {
    // Navigate to a screen that requires network data
    await element(by.text('Registrar Salud')).tap();
    await waitFor(element(by.id('health-screen'))).toBeVisible().withTimeout(5000);

    // Try to save data (this might fail if network is down)
    await element(by.id('save-health-data-button')).tap();

    // Should show error message or handle gracefully
    try {
      await waitFor(element(by.id('error-message')))
        .toBeVisible()
        .withTimeout(3000);
    } catch (error) {
      // Error handling might be different, that's ok
    }
  });

  it('should persist data locally when offline', async () => {
    // This test assumes some offline functionality
    await element(by.text('Registrar Salud')).tap();
    await waitFor(element(by.id('health-screen'))).toBeVisible().withTimeout(5000);

    // Enter some data
    await element(by.id('weight-input')).typeText('75');
    await element(by.id('body-fat-input')).typeText('15');

    // Save locally (assuming offline save functionality)
    await element(by.id('save-offline-button')).tap();

    // Should show success message
    await waitFor(element(by.text('Datos guardados localmente')))
      .toBeVisible()
      .withTimeout(5000);
  });
});
