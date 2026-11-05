Dott.it Workspace – Project Documentation

(v0.9 – June 19 2025)

⸻

1. Purpose

Dott.it Workspace is a multi-tenant web application that lets districts run AI-powered assessments while protecting personally-identifiable information (PII).
Key goals:
•✅ Isolate every tenant’s accounts & raw student data
•✅ Aggregate de-identified assessment events in a single global store for analytics/ML
•✅ Offer instant sub-domain onboarding plus optional customer-owned domains
•✅ Keep the public marketing site wholly separate from the authenticated product

⸻

2. High-Level Architecture

flowchart TD
    subgraph Tenant_Plane
        DB_Tenant[(Postgres<br/>tenant schema / RLS)]
        API[Next.js API<br/>middleware]
        Worker(Background worker<br/>rubric + GPT feedback)
    end

    subgraph Global_Plane
        DB_Global[(Postgres / ClickHouse<br/>AssessmentEvents)]
        BI[BI / ML services]
    end

    Browser -->|submit answer| API
    API -->|INSERT Response| DB_Tenant
    DB_Tenant -- NOTIFY / SQS --> Worker
    Worker -->|INSERT de-ID<br/>AssessmentEvent| DB_Global
    BI <-->|analytics| DB_Global

•Row-Level Security (RLS) on the tenant DB ensures each request only sees its own data.
•A background worker strips PII before writing to AssessmentEvent in the global DB.

⸻

3. URL & DNS Scheme

HostnameRoleNotes
demo.dott.itMarketing siteDeployed from /marketing dir or separate repo
app.demo.dott.itGlobal demo tenantSeeded as Tenant.slug = global
workspace.demo.dott.itAlias → 301 to app. (optional)
{slug}.demo.dott.itRegular tenant workspaceCreated on onboarding
Custom domainse.g. science.wsd.eduAdded to Domain table & Vercel

DNS records:

A      demo.dott.it        → Vercel apex IPs
CNAME  *.demo.dott.it      → cname.vercel-dns.com


⸻

4. Data Planes & Schema

4.1 Tenant Plane (PII)

model Student {
  id         String  @id @default(cuid())
  tenantId   String  @index
  localId    String
  firstName  String
  lastName   String
  email      String?
  responses  Response[]
  @@unique([tenantId, localId])
}

model Response {
  id          String   @id @default(cuid())
  tenantId    String   @index
  studentId   String
  itemId      String
  rawAnswer   Json
  submittedAt DateTime @default(now())
}

•RLS policy enforces tenant_id = current_setting('app.current_tenant').

4.2 Global Plane (De-ID)

model AssessmentEvent {
  id            String   @id @default(cuid())
  anonSubjectId String   @index         // salted SHA-256(tenant:localId)
  tenantId      String   @index         // optional – remove for full anonymisation
  itemId        String   @index
  rubricScore   Float
  aiFeedback    Json
  computedAt    DateTime @default(now())
}


⸻

5. Data Flow

StepActionComponent
1Browser POST /api/responsesNext.js API
2Insert into Response (tenant DB)Prisma
3NOTIFY new_response w/ response_idDB trigger
4Worker fetches row, scores, generates feedbackBackground worker
5Worker computes anonSubjectId and inserts AssessmentEventGlobal DB
6Tenant dashboards & cross-district analytics query AssessmentEventNext.js / BI

Hash function

function anonId(localId: string, tenantId: string) {
  return crypto.createHmac('sha256', process.env.HASH_SALT)
               .update(`${tenantId}:${localId}`)
               .digest('hex');
}


⸻

6. Security & Compliance

TopicMitigation
PII isolationRLS + per-tenant cookies scoped to the host
Cross-tenant auth leakageSession cookie domain = current host
Data residency / FERPARaw student answers stay in tenant plane; AssessmentEvent holds no names/emails
Right-to-be-forgottenDelete row in Student → worker purges matching AssessmentEvent by hash
Injection / CSPMarketing and product are served from different hosts, separate CSPs


⸻

7. Deployment Checklist
1.Vercel projects
•marketing-site → demo.dott.it
•workspace-app → wildcard *.demo.dott.it
2.Env vars
•DATABASE_URL (tenant plane)
•GLOBAL_DATABASE_URL (global plane)
•HASH_SALT – 64 char random
3.Auth provider (Auth0/Clerk)
•Allowed callbacks:
https://app.demo.dott.it/api/auth/callback
https://{slug}.demo.dott.it/api/auth/callback
4.Background worker (Railway or Fly.io)
•Connects to both DBs; listens on NOTIFY new_response
5.RLS bootstrap

ALTER TABLE "Student" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Student" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "Student"
  USING (tenant_id = current_setting('app.current_tenant'));



⸻

8. Local Development

# /etc/hosts
127.0.0.1 wauwatosa.localhost

HOST=wauwatosa.localhost \
HASH_SALT=dev-salt \
DATABASE_URL=postgres://... \
GLOBAL_DATABASE_URL=postgres://... \
next dev

•Middleware sets set_config('app.current_tenant', 'tenant-id', true) for each request.

⸻

9. On-Boarding Script (pseudo)

async function createTenant(name: string, slug: string) {
  const tenant = await prisma.tenant.create({
    data: {
      name,
      slug,
      primaryDomain: `${slug}.demo.dott.it`,
    },
  });

  await createDefaultAdmin(tenant.id, adminEmail);
  // send welcome email…
}


⸻

10. Future Enhancements
•Columnar warehouse: stream AssessmentEvent to ClickHouse for sub-second dashboards.
•Domain-verified SSO: auto-enable SAML based on Domain.verified.
•Partition pruning: monthly partitions on Response with 90-day TTL.
•Fine-grained consent: store parent_consent_at on Student; ETL only when consented.

⸻

11. Glossary

TermMeaning
TenantA school district or organization with its own users & PII
Global planeShared database holding only anonymised assessment events
RLSRow-Level Security – Postgres feature to filter rows per session
AssessmentEventA single scored item response + feedback, stripped of PII


⸻

Maintainer: Matt AW (matt@demo.dott.it) – please open a GitHub issue for questions or improvements.
