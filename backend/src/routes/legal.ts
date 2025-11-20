/**
 * Legal Documents Routes
 * 
 * Serves Privacy Policy and Terms of Service pages.
 * Required for App Store and Google Play submission.
 */

import { Hono } from "hono";
import type { AppType } from "../types";

const legal = new Hono<AppType>();

/**
 * GET /api/legal/privacy-policy
 * Returns Privacy Policy HTML
 */
legal.get("/privacy-policy", async (c) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy - Recenter</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    h1 { color: #8B7AB8; }
    h2 { color: #666; margin-top: 30px; }
    .last-updated { color: #999; font-size: 0.9em; }
  </style>
</head>
<body>
  <h1>Privacy Policy</h1>
  <p class="last-updated">Last Updated: November 16, 2025</p>

  <h2>1. Information We Collect</h2>
  <p>Recenter collects the following information:</p>
  <ul>
    <li><strong>Account Information:</strong> Email address, name (if provided)</li>
    <li><strong>Usage Data:</strong> Sessions created, preferences, subscription status</li>
    <li><strong>Device Information:</strong> Device type, operating system (for app functionality)</li>
    <li><strong>Payment Information:</strong> Processed securely through Apple App Store and Google Play (we do not store payment details)</li>
  </ul>

  <h2>2. How We Use Your Information</h2>
  <p>We use your information to:</p>
  <ul>
    <li>Provide and improve our services</li>
    <li>Personalize your affirmation experience</li>
    <li>Process subscription payments</li>
    <li>Send important service updates (if you opt in)</li>
  </ul>

  <h2>3. Data Storage and Security</h2>
  <p>Your data is stored securely using industry-standard encryption. We use:</p>
  <ul>
    <li>PostgreSQL database with encrypted connections</li>
    <li>Supabase for secure data storage</li>
    <li>Authentication via Better Auth with secure session management</li>
  </ul>

  <h2>4. Third-Party Services</h2>
  <p>We use the following third-party services:</p>
  <ul>
    <li><strong>ElevenLabs:</strong> For text-to-speech generation (your affirmations are sent to generate audio)</li>
    <li><strong>Apple App Store / Google Play:</strong> For subscription payments</li>
    <li><strong>Supabase:</strong> For database and file storage</li>
  </ul>

  <h2>5. Your Rights</h2>
  <p>You have the right to:</p>
  <ul>
    <li>Access your personal data</li>
    <li>Delete your account and data</li>
    <li>Opt out of non-essential communications</li>
    <li>Request a copy of your data</li>
  </ul>

  <h2>6. Children's Privacy</h2>
  <p>Recenter is not intended for children under 13. We do not knowingly collect information from children under 13.</p>

  <h2>7. Changes to This Policy</h2>
  <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.</p>

  <h2>8. Contact Us</h2>
  <p>If you have questions about this Privacy Policy, please contact us at:</p>
  <p>Email: privacy@recenter.app</p>
</body>
</html>
  `;

  return c.html(html);
});

/**
 * GET /api/legal/terms-of-service
 * Returns Terms of Service HTML
 */
legal.get("/terms-of-service", async (c) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terms of Service - Recenter</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    h1 { color: #8B7AB8; }
    h2 { color: #666; margin-top: 30px; }
    .last-updated { color: #999; font-size: 0.9em; }
  </style>
</head>
<body>
  <h1>Terms of Service</h1>
  <p class="last-updated">Last Updated: November 16, 2025</p>

  <h2>1. Acceptance of Terms</h2>
  <p>By accessing and using Recenter, you accept and agree to be bound by these Terms of Service. If you do not agree, please do not use our service.</p>

  <h2>2. Description of Service</h2>
  <p>Recenter is a mobile application that provides personalized affirmation sessions with audio playback, binaural beats, and background sounds for meditation and self-improvement purposes.</p>

  <h2>3. Subscription Terms</h2>
  <ul>
    <li><strong>Free Tier:</strong> Limited to 3 custom sessions per month</li>
    <li><strong>Pro Tier:</strong> Unlimited custom sessions, premium voices, and features</li>
    <li><strong>Billing:</strong> Subscriptions auto-renew unless cancelled at least 24 hours before the end of the current period</li>
    <li><strong>Cancellation:</strong> You can cancel your subscription at any time through your device's App Store or Play Store settings</li>
    <li><strong>Refunds:</strong> Refund requests are handled by Apple or Google according to their policies</li>
  </ul>

  <h2>4. User Accounts</h2>
  <p>You are responsible for:</p>
  <ul>
    <li>Maintaining the security of your account</li>
    <li>All activities that occur under your account</li>
    <li>Providing accurate information when creating an account</li>
  </ul>

  <h2>5. Acceptable Use</h2>
  <p>You agree not to:</p>
  <ul>
    <li>Use the service for any illegal purpose</li>
    <li>Attempt to reverse engineer or hack the service</li>
    <li>Share your account with others</li>
    <li>Use automated systems to access the service</li>
  </ul>

  <h2>6. Intellectual Property</h2>
  <p>All content, features, and functionality of Recenter are owned by us and protected by copyright, trademark, and other intellectual property laws.</p>

  <h2>7. Limitation of Liability</h2>
  <p>Recenter is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service.</p>

  <h2>8. Changes to Terms</h2>
  <p>We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.</p>

  <h2>9. Termination</h2>
  <p>We may terminate or suspend your account at any time for violation of these terms or for any other reason.</p>

  <h2>10. Contact Information</h2>
  <p>For questions about these Terms of Service, please contact us at:</p>
  <p>Email: support@recenter.app</p>
</body>
</html>
  `;

  return c.html(html);
});

export { legal };

