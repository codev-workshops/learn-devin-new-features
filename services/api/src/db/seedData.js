// Deterministic training data. Every lab and test relies on these exact values.
const TENANTS = [
  { slug: 'acme', name: 'Acme Logistics' },
  { slug: 'globex', name: 'Globex Health' },
];

const USERS = [
  { tenant: 'acme', email: 'ava.admin@acme.test', name: 'Ava Admin', role: 'admin', rate: 9000 },
  { tenant: 'acme', email: 'mia.manager@acme.test', name: 'Mia Manager', role: 'manager', rate: 7000 },
  { tenant: 'acme', email: 'eli@acme.test', name: 'Eli Employee', role: 'employee', rate: 4500, manager: 'mia.manager@acme.test' },
  { tenant: 'acme', email: 'noah@acme.test', name: 'Noah Employee', role: 'employee', rate: 4200, manager: 'mia.manager@acme.test' },
  { tenant: 'globex', email: 'gus.admin@globex.test', name: 'Gus Admin', role: 'admin', rate: 8800 },
  { tenant: 'globex', email: 'gia.manager@globex.test', name: 'Gia Manager', role: 'manager', rate: 6800 },
  { tenant: 'globex', email: 'omar@globex.test', name: 'Omar Employee', role: 'employee', rate: 4000, manager: 'gia.manager@globex.test' },
];

const PROJECTS = [
  { tenant: 'acme', code: 'ACM-OPS', name: 'Fleet operations', billable: true },
  { tenant: 'acme', code: 'ACM-WMS', name: 'Warehouse management system', billable: true },
  { tenant: 'acme', code: 'ACM-INT', name: 'Internal training', billable: false },
  { tenant: 'globex', code: 'GLX-EHR', name: 'Electronic health records', billable: true },
  { tenant: 'globex', code: 'GLX-SUP', name: 'Clinical support desk', billable: true },
];

// Four ISO weeks starting Monday 2026-09-07. Weeks 1-3 are approved, week 4 is submitted.
const WEEK_STARTS = ['2026-09-07', '2026-09-14', '2026-09-21', '2026-09-28'];

function addDays(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function hoursFor(email, weekIndex, dayIndex) {
  if (email === 'eli@acme.test' && weekIndex === 1 && (dayIndex === 1 || dayIndex === 2)) return 10;
  if (dayIndex === 4) return 6;
  return 8;
}

function buildEntries() {
  const workers = USERS.filter((user) => user.role !== 'admin');
  const entries = [];
  WEEK_STARTS.forEach((weekStart, weekIndex) => {
    for (const user of workers) {
      const projects = PROJECTS.filter((project) => project.tenant === user.tenant);
      for (let dayIndex = 0; dayIndex < 5; dayIndex += 1) {
        const project = projects[(weekIndex + dayIndex) % projects.length];
        entries.push({
          email: user.email,
          projectCode: project.code,
          workDate: addDays(weekStart, dayIndex),
          hours: hoursFor(user.email, weekIndex, dayIndex),
          description: `${project.name} work`,
          status: weekIndex < 3 ? 'approved' : 'submitted',
        });
      }
    }
  });
  entries.push({
    email: 'eli@acme.test',
    projectCode: 'ACM-OPS',
    workDate: '2026-10-05',
    hours: 4,
    description: 'Route planning draft',
    status: 'draft',
  });
  return entries;
}

module.exports = { TENANTS, USERS, PROJECTS, WEEK_STARTS, buildEntries };
