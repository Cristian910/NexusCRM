import { PrismaClient, Role, DealStage, ClientStatus, TaskStatus, ActivityType, EntityType, NotificationType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ── tiny deterministic-ish random helpers ──────────────────────────
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function weightedStage(): DealStage {
  // Funnel shape: most deals sit early, fewer make it all the way through.
  const roll = Math.random();
  if (roll < 0.28) return DealStage.LEAD;
  if (roll < 0.5) return DealStage.CONTACTED;
  if (roll < 0.68) return DealStage.NEGOTIATION;
  if (roll < 0.86) return DealStage.CLOSED_WON;
  return DealStage.CLOSED_LOST;
}
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(randInt(8, 18), randInt(0, 59), 0, 0);
  return d;
}
function daysFromNow(n: number): Date {
  return daysAgo(-n);
}

const STAGE_ORDER: DealStage[] = [
  DealStage.LEAD,
  DealStage.CONTACTED,
  DealStage.NEGOTIATION,
  DealStage.CLOSED_WON, // CLOSED_LOST branches off NEGOTIATION separately below
];

async function main() {
  console.log('🌱 Seeding database...');

  // ────────────────────────────────────────────────────────────────
  // 1. Minimal reference org (kept for backwards-compat with anyone
  //    who already bookmarked "acme-corp" / admin@acme.com locally).
  // ────────────────────────────────────────────────────────────────
  const acme = await prisma.organization.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: { name: 'Acme Corp', slug: 'acme-corp' },
  });

  await prisma.user.upsert({
    where: { email_organizationId: { email: 'admin@acme.com', organizationId: acme.id } },
    update: {},
    create: {
      email: 'admin@acme.com',
      password: await bcrypt.hash('Admin1234!', 12),
      firstName: 'Admin',
      lastName: 'User',
      role: Role.OWNER,
      organizationId: acme.id,
    },
  });

  // ────────────────────────────────────────────────────────────────
  // 2. Demo organization — fully populated so a recruiter can click
  //    "Explore the live demo" on the login page and immediately see
  //    a working pipeline, charts with real shape, and an activity feed.
  //    Credentials mirrored in front/features/auth/demo-credentials.ts.
  // ────────────────────────────────────────────────────────────────
  const demoOrg = await prisma.organization.upsert({
    where: { slug: 'demo' },
    update: {},
    create: { name: 'NexusCRM Demo', slug: 'demo' },
  });

  const demoPassword = await bcrypt.hash('Demo1234!', 12);

  const userSeeds = [
    { email: 'demo@nexuscrm.io', firstName: 'Alexandra', lastName: 'Chen', role: Role.OWNER },
    { email: 'marcus.rivera@nexuscrm.io', firstName: 'Marcus', lastName: 'Rivera', role: Role.ADMIN },
    { email: 'priya.patel@nexuscrm.io', firstName: 'Priya', lastName: 'Patel', role: Role.MEMBER },
    { email: 'jordan.lee@nexuscrm.io', firstName: 'Jordan', lastName: 'Lee', role: Role.MEMBER },
    { email: 'sam.okafor@nexuscrm.io', firstName: 'Sam', lastName: 'Okafor', role: Role.VIEWER },
  ] as const;

  const users = [];
  for (const u of userSeeds) {
    const user = await prisma.user.upsert({
      where: { email_organizationId: { email: u.email, organizationId: demoOrg.id } },
      update: {},
      create: {
        email: u.email,
        password: demoPassword,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        organizationId: demoOrg.id,
      },
    });
    users.push(user);
  }
  const [owner, admin, ...members] = users;
  const assignable = [owner, admin, ...members]; // everyone except VIEWER can still be assigned work

  // Wipe previously-seeded demo transactional data so this script is
  // safely re-runnable without duplicating clients/deals/tasks on every run.
  await prisma.notification.deleteMany({ where: { organizationId: demoOrg.id } });
  await prisma.activity.deleteMany({ where: { organizationId: demoOrg.id } });
  await prisma.dealStageHistory.deleteMany({ where: { deal: { organizationId: demoOrg.id } } });
  await prisma.task.deleteMany({ where: { organizationId: demoOrg.id } });
  await prisma.deal.deleteMany({ where: { organizationId: demoOrg.id } });
  await prisma.client.deleteMany({ where: { organizationId: demoOrg.id } });

  // ── Clients ───────────────────────────────────────────────────
  const clientSeeds = [
    { name: 'Elena Vargas', company: 'Meridian Logistics', website: 'meridianlogistics.com' },
    { name: 'Tom Whitfield', company: 'Northstar Financial', website: 'northstarfinancial.com' },
    { name: 'Aiko Tanaka', company: 'Kaizen Manufacturing', website: 'kaizenmfg.com' },
    { name: 'Daniel Brooks', company: 'Brookstone Realty', website: 'brookstonerealty.com' },
    { name: 'Fatima Al-Sayed', company: 'Horizon Health Group', website: 'horizonhealthgroup.com' },
    { name: 'Ravi Krishnan', company: 'Cobalt Analytics', website: 'cobaltanalytics.io' },
    { name: 'Nina Petrov', company: 'Solstice Media', website: 'solsticemedia.com' },
    { name: 'Carlos Mendez', company: 'Vertex Construction', website: 'vertexconstruction.com' },
    { name: 'Grace Kim', company: 'Willow & Birch Retail', website: 'willowbirch.com' },
    { name: "Liam O'Connor", company: 'Anchor Freight Co.', website: 'anchorfreight.com' },
    { name: 'Sofia Romano', company: 'Lumen Design Studio', website: 'lumendesign.studio' },
    { name: 'Ahmed Hassan', company: 'Pinnacle Energy Partners', website: 'pinnacleenergy.com' },
    { name: 'Hannah Fischer', company: 'Brightline Education', website: 'brightlineedu.com' },
    { name: 'Marco Silva', company: 'Ferro Industrial Supply', website: 'ferroindustrial.com' },
    { name: 'Yuki Sato', company: 'Origami Robotics', website: 'origamirobotics.com' },
    { name: 'Isabella Costa', company: 'Verde Agritech', website: 'verdeagritech.com' },
    { name: 'Owen Bennett', company: 'Cascade Outdoor Gear', website: 'cascadegear.com' },
    { name: 'Layla Hussein', company: 'Amber Wellness Spa Group', website: 'amberwellness.com' },
  ] as const;

  const clients = [];
  for (let i = 0; i < clientSeeds.length; i++) {
    const c = clientSeeds[i];
    const createdBy = pick(assignable);
    const createdAt = daysAgo(randInt(5, 150));
    const status = i % 11 === 0 ? ClientStatus.ARCHIVED : i % 6 === 0 ? ClientStatus.INACTIVE : ClientStatus.ACTIVE;
    const client = await prisma.client.create({
      data: {
        name: c.name,
        company: c.company,
        website: `https://${c.website}`,
        email: `contact@${c.website}`,
        phone: `+1 ${randInt(200, 989)}-${randInt(200, 989)}-${randInt(1000, 9999)}`,
        status,
        organizationId: demoOrg.id,
        createdById: createdBy.id,
        createdAt,
        updatedAt: createdAt,
      },
    });
    clients.push(client);

    await prisma.activity.create({
      data: {
        type: ActivityType.CLIENT_CREATED,
        description: `${createdBy.firstName} ${createdBy.lastName} added ${client.name} (${client.company})`,
        entityId: client.id,
        entityType: EntityType.CLIENT,
        userId: createdBy.id,
        organizationId: demoOrg.id,
        createdAt,
      },
    });
  }

  // ── Deals + stage history ────────────────────────────────────
  const dealTitles = [
    'Annual platform license', 'Q3 expansion package', 'Enterprise onboarding',
    'Multi-year support contract', 'Analytics add-on upgrade', 'Regional rollout',
    'Data migration project', 'Custom integration build', 'Team seats expansion',
    'Renewal — premium tier', 'Pilot-to-production upgrade', 'API access package',
    'Consulting retainer', 'Hardware refresh bundle', 'Compliance audit package',
    'Training & certification', 'White-label partnership', 'Priority support SLA',
    'New market entry deal', 'Cross-sell — reporting suite', 'Franchise rollout',
    'Warehouse automation deal', 'Fleet management contract', 'Marketing platform bundle',
    'Security audit engagement', 'Cloud migration project', 'Vendor consolidation deal',
    'Loyalty program build', 'Supply chain integration', 'Year-end renewal',
    'Green energy retrofit', 'Franchise POS rollout', 'HR platform upgrade',
    'Localization project', 'Disaster recovery plan', 'Q1 pipeline kickoff',
  ];

  const deals = [];
  for (let i = 0; i < dealTitles.length; i++) {
    const client = pick(clients);
    const stage = weightedStage();
    const createdAt = daysAgo(randInt(3, 150));
    const assignedTo = Math.random() < 0.92 ? pick(assignable) : null;
    const createdBy = pick(assignable);
    const value = randInt(15, 1200) * 100; // $1.5k – $120k, mostly round-ish

    const deal = await prisma.deal.create({
      data: {
        title: `${dealTitles[i]} — ${client.company}`,
        value,
        stage,
        clientId: client.id,
        assignedToId: assignedTo?.id ?? null,
        createdById: createdBy.id,
        organizationId: demoOrg.id,
        expectedCloseDate:
          stage === DealStage.CLOSED_WON || stage === DealStage.CLOSED_LOST
            ? undefined
            : daysFromNow(randInt(5, 60)),
        notes: Math.random() < 0.4 ? 'Key decision-maker is the VP of Operations — loop them in on next steps.' : undefined,
        createdAt,
        updatedAt: createdAt,
      },
    });
    deals.push(deal);

    // Build a believable stage-progression trail up to the deal's final stage.
    const path: DealStage[] =
      stage === DealStage.CLOSED_LOST
        ? [DealStage.LEAD, DealStage.CONTACTED, DealStage.NEGOTIATION, DealStage.CLOSED_LOST]
        : STAGE_ORDER.slice(0, STAGE_ORDER.indexOf(stage) + 1);

    let prev: DealStage | null = null;
    for (let s = 0; s < path.length; s++) {
      const stepDate = new Date(createdAt);
      stepDate.setDate(stepDate.getDate() + s * randInt(2, 6));
      await prisma.dealStageHistory.create({
        data: {
          dealId: deal.id,
          fromStage: prev,
          toStage: path[s],
          changedById: (assignedTo ?? createdBy).id,
          createdAt: stepDate > new Date() ? new Date() : stepDate,
        },
      });
      prev = path[s];
    }

    await prisma.activity.create({
      data: {
        type: ActivityType.DEAL_CREATED,
        description: `${createdBy.firstName} ${createdBy.lastName} created deal "${deal.title}"`,
        entityId: deal.id,
        entityType: EntityType.DEAL,
        userId: createdBy.id,
        organizationId: demoOrg.id,
        createdAt,
      },
    });
    if (stage !== DealStage.LEAD) {
      const activityType =
        stage === DealStage.CLOSED_WON
          ? ActivityType.DEAL_CLOSED_WON
          : stage === DealStage.CLOSED_LOST
            ? ActivityType.DEAL_CLOSED_LOST
            : ActivityType.DEAL_STAGE_CHANGED;
      await prisma.activity.create({
        data: {
          type: activityType,
          description: `Deal "${deal.title}" moved to ${stage.replace('_', ' ')}`,
          entityId: deal.id,
          entityType: EntityType.DEAL,
          userId: (assignedTo ?? createdBy).id,
          organizationId: demoOrg.id,
          createdAt: daysFromNow(0),
        },
      });
    }
  }

  // ── Tasks ─────────────────────────────────────────────────────
  const taskSeeds = [
    'Send proposal follow-up', 'Schedule discovery call', 'Prepare contract draft',
    'Confirm pricing with finance', 'Send onboarding materials', 'Book kickoff meeting',
    'Review SOW with legal', 'Follow up on unanswered email', 'Demo the reporting module',
    'Collect signed NDA', 'Update CRM with call notes', 'Check in post-implementation',
    'Renew annual contract', 'Escalate blocked integration', 'Prepare QBR deck',
    'Confirm go-live date', 'Send satisfaction survey', 'Coordinate technical handoff',
    'Draft renewal proposal', 'Review support ticket backlog', 'Plan expansion pitch',
    'Verify billing details', 'Send holiday check-in', 'Align on success metrics',
    'Debrief after client call',
  ];

  for (let i = 0; i < taskSeeds.length; i++) {
    const roll = Math.random();
    const status =
      roll < 0.3 ? TaskStatus.COMPLETED :
      roll < 0.45 ? TaskStatus.CANCELLED :
      roll < 0.65 ? TaskStatus.IN_PROGRESS :
      TaskStatus.PENDING;

    // A chunk of still-open tasks are intentionally overdue — makes the
    // "Overdue" filter and dashboard widget show something real.
    const isOverdue = (status === TaskStatus.PENDING || status === TaskStatus.IN_PROGRESS) && Math.random() < 0.35;
    const dueDate = isOverdue ? daysAgo(randInt(1, 12)) : daysFromNow(randInt(0, 21));
    const createdAt = daysAgo(randInt(1, 60));
    const assignedTo = pick(assignable);
    const createdBy = pick(assignable);
    const linkedDeal = Math.random() < 0.6 ? pick(deals) : null;

    const task = await prisma.task.create({
      data: {
        title: taskSeeds[i],
        description: linkedDeal ? `Related to deal: ${linkedDeal.title}` : undefined,
        dueDate,
        status,
        assignedToId: assignedTo.id,
        dealId: linkedDeal?.id ?? null,
        createdById: createdBy.id,
        organizationId: demoOrg.id,
        createdAt,
        updatedAt: createdAt,
      },
    });

    await prisma.activity.create({
      data: {
        type: ActivityType.TASK_CREATED,
        description: `${createdBy.firstName} ${createdBy.lastName} created task "${task.title}"`,
        entityId: task.id,
        entityType: EntityType.TASK,
        userId: createdBy.id,
        organizationId: demoOrg.id,
        createdAt,
      },
    });
    if (status === TaskStatus.COMPLETED) {
      await prisma.activity.create({
        data: {
          type: ActivityType.TASK_COMPLETED,
          description: `${assignedTo.firstName} ${assignedTo.lastName} completed "${task.title}"`,
          entityId: task.id,
          entityType: EntityType.TASK,
          userId: assignedTo.id,
          organizationId: demoOrg.id,
          createdAt: daysFromNow(0),
        },
      });
    }
  }

  // ── Notifications (for the demo owner) ──────────────────────────
  const notificationSeeds: Array<{ title: string; message: string; type: NotificationType; read: boolean }> = [
    { title: 'Deal won! 🎉', message: 'Your deal with a client just closed as won.', type: NotificationType.SUCCESS, read: false },
    { title: 'Task overdue', message: "You have a task that's past its due date.", type: NotificationType.WARNING, read: false },
    { title: 'New teammate joined', message: 'Priya Patel accepted their invite and joined the team.', type: NotificationType.INFO, read: true },
    { title: 'Deal at risk', message: "A negotiation-stage deal hasn't moved in 14 days.", type: NotificationType.WARNING, read: false },
    { title: 'Weekly summary ready', message: 'Your analytics summary for last week is ready to view.', type: NotificationType.INFO, read: true },
    { title: 'Contract signed', message: 'A client signed their contract — nice work!', type: NotificationType.SUCCESS, read: true },
    { title: 'Sync failed', message: 'The last email sync ran into an issue. Retry from settings.', type: NotificationType.ERROR, read: false },
  ];
  for (const n of notificationSeeds) {
    await prisma.notification.create({
      data: {
        title: n.title,
        message: n.message,
        type: n.type,
        read: n.read,
        userId: owner.id,
        organizationId: demoOrg.id,
        createdAt: daysAgo(randInt(0, 10)),
      },
    });
  }

  console.log('✅ Seed complete');
  console.log('');
  console.log('   Demo login  → org: demo | email: demo@nexuscrm.io | password: Demo1234!');
  console.log('   Acme login  → org: acme-corp | email: admin@acme.com | password: Admin1234!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
