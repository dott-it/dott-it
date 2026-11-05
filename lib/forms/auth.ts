import { google, Auth } from 'googleapis';
import * as dotenv from 'dotenv';
import { getImpersonatedGoogleAccessToken } from '@/lib/library/export/impersonated-access-token';
import { loadGoogleServiceAccountCredentials } from '@/lib/library/export/load-google-service-account-credentials';

dotenv.config();

export class GoogleAuth {
  private auth: Auth.GoogleAuth | null = null;
  private impersonationSubject: string | undefined;
  private activeScopes: string[] = [];
  private readonly scopes = [
    'https://www.googleapis.com/auth/forms.body',
    'https://www.googleapis.com/auth/forms.responses.readonly',
    'https://www.googleapis.com/auth/drive'
  ];

  async authenticate(options?: {
    /** Pass null to skip impersonation (e.g. extract-only / dry-run Drive reads). */
    subject?: string | null
    /** Extra OAuth scopes (e.g. Apps Script API for native File upload conversion). */
    extraScopes?: string[]
  }): Promise<Auth.BaseExternalAccountClient | Auth.JWT> {
    try {
      const credentials = loadGoogleServiceAccountCredentials()
      // Forms cannot be owned by a bare service account — impersonate a Workspace user
      // (requires domain-wide delegation). Example: GOOGLE_FORMS_IMPERSONATE_USER=ops@eddolearning.com
      const subject =
        options?.subject === null
          ? undefined
          : (options?.subject ?? process.env.GOOGLE_FORMS_IMPERSONATE_USER)?.trim() || undefined;

      const scopes = [...this.scopes, ...(options?.extraScopes ?? [])]
      this.impersonationSubject = subject
      this.activeScopes = scopes

      this.auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: credentials.client_email,
          private_key: credentials.private_key,
        },
        scopes,
        ...(subject ? { clientOptions: { subject } } : {}),
      });

      const authClient = await this.auth.getClient() as Auth.JWT | Auth.BaseExternalAccountClient;
      google.options({ auth: authClient });

      if (subject) {
        console.log(`✅ Google Authentication successful (impersonating ${subject})`);
      } else {
        console.log('✅ Google Authentication successful');
      }
      return authClient;
    } catch (error) {
      console.error('❌ Authentication failed:', (error as Error).message);
      throw error;
    }
  }

  getAuthClient(): Auth.GoogleAuth | null {
    return this.auth;
  }

  async getAccessToken(): Promise<string> {
    if (!this.auth) {
      throw new Error('Authentication not initialized. Call authenticate() first.');
    }

    // Prefer raw JWT bearer exchange when impersonating — googleapis/gaxios + undici
    // in Next.js route handlers often fail with "incorrect header check" / premature close.
    if (this.impersonationSubject) {
      return getImpersonatedGoogleAccessToken({
        subject: this.impersonationSubject,
        scopes: this.activeScopes.length > 0 ? this.activeScopes : this.scopes,
      })
    }

    const client = await this.auth.getClient();
    const accessTokenResponse = await client.getAccessToken();

    if (!accessTokenResponse.token) {
      throw new Error('Failed to get access token');
    }

    return accessTokenResponse.token;
  }
}
