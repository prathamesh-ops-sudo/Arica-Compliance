import { FullConfig } from "@playwright/test";

// Test user credentials - read from environment variables or use defaults
// These are NOT real credentials - they are only used for E2E testing against ephemeral test databases
export const TEST_USER = {
  email: process.env.E2E_TEST_EMAIL || "e2e-test@aricainsights.com",
  password: process.env.E2E_TEST_PASSWORD || "testpassword",
  firstName: "E2E",
  lastName: "Test",
};

/**
 * Global setup for Playwright E2E tests
 * This file runs once before all tests
 * Creates a test user in the database for authentication
 */
async function globalSetup(config: FullConfig) {
  const authFile = "e2e/.auth/user.json";
  const backendUrl = "http://localhost:3000";

  console.log("Running global setup...");

  // Try to create a test user via the signup API
  // If user already exists, this will fail silently (which is fine)
  try {
    const signupResponse = await fetch(`${backendUrl}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password,
        firstName: TEST_USER.firstName,
        lastName: TEST_USER.lastName,
      }),
    });

    if (signupResponse.ok) {
      console.log("Test user created successfully");
    } else {
      const errorData = await signupResponse.json().catch(() => ({}));
      // User might already exist, which is fine
      if (errorData.message?.includes("already exists") || signupResponse.status === 409) {
        console.log("Test user already exists, continuing...");
      } else {
        console.log(`Signup response: ${signupResponse.status} - ${JSON.stringify(errorData)}`);
      }
    }
  } catch (error) {
    // Backend might not be ready yet, tests will handle login
    console.log("Could not create test user during setup (backend may not be ready):", error);
  }

  console.log(`Auth state will be stored at: ${authFile}`);
  console.log("Global setup complete");
}

export default globalSetup;
