import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';

export const DEFAULT_TENANT_ID = 'a0000000-0000-0000-0000-000000000001';

const SEED_USERS = [
  { email: 'admin@seed.local', role: 'tenant_admin' },
  { email: 'supervisor@seed.local', role: 'supervisor' },
  { email: 'staff@seed.local', role: 'staff' },
];

// ── Fixed UUIDs ──────────────────────────────────────────────────────────────

const C1 = 'a1000000-0000-0000-0000-000000000001'; // Maria Silva
const C2 = 'a1000000-0000-0000-0000-000000000002'; // João Santos
const C3 = 'a1000000-0000-0000-0000-000000000003'; // Ana Oliveira
const C4 = 'a1000000-0000-0000-0000-000000000004'; // Carlos Souza
const C5 = 'a1000000-0000-0000-0000-000000000005'; // Beatriz Lima

const S1 = 'a2000000-0000-0000-0000-000000000001'; // Limpeza Residencial
const S2 = 'a2000000-0000-0000-0000-000000000002'; // Limpeza Comercial
const S3 = 'a2000000-0000-0000-0000-000000000003'; // Limpeza Pós-Obra
const S4 = 'a2000000-0000-0000-0000-000000000004'; // Higienização de Sofá
const S5 = 'a2000000-0000-0000-0000-000000000005'; // Limpeza de Vidros

const PR1 = 'a3000000-0000-0000-0000-000000000001'; // Residencial rule
const PR2 = 'a3000000-0000-0000-0000-000000000002'; // Comercial rule (10% off)
const PR3 = 'a3000000-0000-0000-0000-000000000003'; // Pós-Obra rule (2×)
const PR4 = 'a3000000-0000-0000-0000-000000000004'; // Sofá rule
const PR5 = 'a3000000-0000-0000-0000-000000000005'; // Vidros rule (5% off)

const Q1 = 'a4000000-0000-0000-0000-000000000001'; // draft
const Q2 = 'a4000000-0000-0000-0000-000000000002'; // sent
const Q3 = 'a4000000-0000-0000-0000-000000000003'; // accepted (Ana + Pós-Obra)
const Q4 = 'a4000000-0000-0000-0000-000000000004'; // rejected
const Q5 = 'a4000000-0000-0000-0000-000000000005'; // accepted (Beatriz + Vidros)
const Q6 = 'a4000000-0000-0000-0000-000000000006'; // accepted (Beatriz + Comercial)
const Q7 = 'a4000000-0000-0000-0000-000000000007'; // accepted (Maria + Sofá)
const Q8 = 'a4000000-0000-0000-0000-000000000008'; // accepted (João + Residencial)

const B1 = 'a5000000-0000-0000-0000-000000000001'; // confirmed
const B2 = 'a5000000-0000-0000-0000-000000000002'; // confirmed
const B3 = 'a5000000-0000-0000-0000-000000000003'; // completed
const B4 = 'a5000000-0000-0000-0000-000000000004'; // cancelled
const B5 = 'a5000000-0000-0000-0000-000000000005'; // rescheduled

export async function seed(dataSource: DataSource): Promise<void> {
  const seedPassword = process.env.SEED_DEFAULT_PASSWORD;
  if (!seedPassword) {
    throw new Error('SEED_DEFAULT_PASSWORD environment variable is required');
  }

  const passwordHash = await bcrypt.hash(seedPassword, 10);

  await dataSource.query(
    `INSERT INTO tenants (id, name, subscription_plan, currency, timezone, tenant_slug)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO NOTHING`,
    [DEFAULT_TENANT_ID, 'Default Tenant', 'basic', 'BRL', 'America/Sao_Paulo', 'default'],
  );

  for (const user of SEED_USERS) {
    await dataSource.query(
      `INSERT INTO users (id, tenant_id, email, password_hash, roles, first_name, last_name)
       VALUES (uuid_generate_v4(), $1, $2, $3, ARRAY[$4], '', '')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [DEFAULT_TENANT_ID, user.email, passwordHash, user.role],
    );
  }

  const [adminRow] = await dataSource.query(
    `SELECT id FROM users WHERE email = $1 AND tenant_id = $2 LIMIT 1`,
    ['admin@seed.local', DEFAULT_TENANT_ID],
  );
  const adminId: string = adminRow?.id;
  if (!adminId) throw new Error('Admin user not found after seed');

  // ── Clients ─────────────────────────────────────────────────────────────────

  const clients = [
    { id: C1, name: 'Maria Silva',   email: 'maria@test.com',   phone: '11999990001' },
    { id: C2, name: 'João Santos',   email: 'joao@test.com',    phone: '11999990002' },
    { id: C3, name: 'Ana Oliveira',  email: 'ana@test.com',     phone: '11999990003' },
    { id: C4, name: 'Carlos Souza',  email: 'carlos@test.com',  phone: '11999990004' },
    { id: C5, name: 'Beatriz Lima',  email: 'beatriz@test.com', phone: '11999990005' },
  ];

  for (const c of clients) {
    await dataSource.query(
      `INSERT INTO clients (id, tenant_id, name, email, phone, address_id, preferred_language)
       VALUES ($1, $2, $3, $4, $5, NULL, 'pt-BR')
       ON CONFLICT (id) DO NOTHING`,
      [c.id, DEFAULT_TENANT_ID, c.name, c.email, c.phone],
    );
  }

  // ── Services ─────────────────────────────────────────────────────────────────

  const services = [
    { id: S1, name: 'Limpeza Residencial', description: 'Limpeza completa de residências', cents: 800,   unit: 'sqm'  },
    { id: S2, name: 'Limpeza Comercial',   description: 'Limpeza de ambientes comerciais', cents: 1200,  unit: 'sqm'  },
    { id: S3, name: 'Limpeza Pós-Obra',    description: 'Limpeza após reformas e obras',   cents: 2000,  unit: 'sqm'  },
    { id: S4, name: 'Higienização de Sofá',description: 'Higienização profunda de estofados', cents: 15000, unit: 'flat' },
    { id: S5, name: 'Limpeza de Vidros',   description: 'Limpeza de vidros e fachadas',    cents: 1500,  unit: 'sqm'  },
  ];

  for (const s of services) {
    await dataSource.query(
      `INSERT INTO services (id, tenant_id, name, description, base_rate_cents, unit)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [s.id, DEFAULT_TENANT_ID, s.name, s.description, s.cents, s.unit],
    );
  }

  // ── Pricing Rules ────────────────────────────────────────────────────────────

  const pricingRules = [
    { id: PR1, serviceId: S1, discount: 0,  multiplier: '1.0000' },
    { id: PR2, serviceId: S2, discount: 10, multiplier: '1.0000' },
    { id: PR3, serviceId: S3, discount: 0,  multiplier: '2.0000' },
    { id: PR4, serviceId: S4, discount: 0,  multiplier: '1.0000' },
    { id: PR5, serviceId: S5, discount: 5,  multiplier: '1.0000' },
  ];

  for (const pr of pricingRules) {
    await dataSource.query(
      `INSERT INTO pricing_rules (id, tenant_id, service_id, min_area, max_area, frequency, discount_percent, price_multiplier)
       VALUES ($1, $2, $3, NULL, NULL, 'one_time', $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [pr.id, DEFAULT_TENANT_ID, pr.serviceId, pr.discount, pr.multiplier],
    );
  }

  // ── Quotes ───────────────────────────────────────────────────────────────────
  // estimated_total_cents: base_rate * area (no pricing rule applied for simplicity)

  const quotes = [
    { id: Q1, clientId: C1, serviceId: S1, status: 'draft',    cents: 64000,   interval: '+30 days'  },
    { id: Q2, clientId: C2, serviceId: S2, status: 'sent',     cents: 180000,  interval: '+15 days'  },
    { id: Q3, clientId: C3, serviceId: S3, status: 'accepted', cents: 400000,  interval: '+20 days'  },
    { id: Q4, clientId: C4, serviceId: S1, status: 'rejected', cents: 48000,   interval: '-5 days'   },
    { id: Q5, clientId: C5, serviceId: S5, status: 'accepted', cents: 150000,  interval: '+10 days'  },
    { id: Q6, clientId: C5, serviceId: S2, status: 'accepted', cents: 60000,   interval: '+5 days'   },
    { id: Q7, clientId: C1, serviceId: S4, status: 'accepted', cents: 15000,   interval: '+25 days'  },
    { id: Q8, clientId: C2, serviceId: S1, status: 'accepted', cents: 96000,   interval: '+12 days'  },
  ];

  for (const q of quotes) {
    await dataSource.query(
      `INSERT INTO quotes (id, tenant_id, client_id, service_id, pricing_rule_id, status,
         estimated_total_cents, currency, valid_until, manual_discount_percent, created_by)
       VALUES ($1, $2, $3, $4, NULL, $5, $6, 'BRL',
         NOW() + INTERVAL '${q.interval}', 0, $7)
       ON CONFLICT (id) DO NOTHING`,
      [q.id, DEFAULT_TENANT_ID, q.clientId, q.serviceId, q.status, q.cents, adminId],
    );
  }

  // ── Bookings ─────────────────────────────────────────────────────────────────

  type BookingSeed = {
    id: string; quoteId: string; clientId: string; serviceId: string;
    status: string; startExpr: string; endExpr: string;
    team: string | null; idem: string;
  };

  const bookings: BookingSeed[] = [
    {
      id: B1, quoteId: Q3, clientId: C3, serviceId: S3, status: 'confirmed',
      startExpr: `NOW() + INTERVAL '2 days 9 hours'`,
      endExpr:   `NOW() + INTERVAL '2 days 13 hours'`,
      team: 'Equipe Alpha', idem: 'idem-key-seed-0001',
    },
    {
      id: B2, quoteId: Q5, clientId: C5, serviceId: S5, status: 'confirmed',
      startExpr: `NOW() + INTERVAL '3 days 14 hours'`,
      endExpr:   `NOW() + INTERVAL '3 days 17 hours'`,
      team: 'Equipe Beta', idem: 'idem-key-seed-0002',
    },
    {
      id: B3, quoteId: Q6, clientId: C5, serviceId: S2, status: 'completed',
      startExpr: `NOW() - INTERVAL '2 days' + INTERVAL '8 hours'`,
      endExpr:   `NOW() - INTERVAL '2 days' + INTERVAL '12 hours'`,
      team: 'Equipe Beta', idem: 'idem-key-seed-0003',
    },
    {
      id: B4, quoteId: Q7, clientId: C1, serviceId: S4, status: 'cancelled',
      startExpr: `NOW() + INTERVAL '5 days 10 hours'`,
      endExpr:   `NOW() + INTERVAL '5 days 14 hours'`,
      team: null, idem: 'idem-key-seed-0004',
    },
    {
      id: B5, quoteId: Q8, clientId: C2, serviceId: S1, status: 'rescheduled',
      startExpr: `NOW() + INTERVAL '7 days 9 hours'`,
      endExpr:   `NOW() + INTERVAL '7 days 11 hours'`,
      team: 'Equipe Gamma', idem: 'idem-key-seed-0005',
    },
  ];

  for (const b of bookings) {
    await dataSource.query(
      `INSERT INTO bookings (id, tenant_id, quote_id, client_id, service_id,
         scheduled_start, scheduled_end, status, assigned_team, idempotency_key)
       VALUES ($1, $2, $3, $4, $5,
         ${b.startExpr}, ${b.endExpr},
         $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [b.id, DEFAULT_TENANT_ID, b.quoteId, b.clientId, b.serviceId,
       b.status, b.team, b.idem],
    );
  }
}

if (require.main === module) {
  AppDataSource.initialize()
    .then((ds) => seed(ds))
    .then(() => {
      console.log('Seed completed successfully');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}
