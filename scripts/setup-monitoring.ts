/**
 * Create / update Better Stack uptime monitors for SLJ production.
 *
 * Requires: BETTER_STACK_UPTIME_API_TOKEN
 *
 *   pnpm exec tsx scripts/setup-monitoring.ts
 *
 * Docs: https://betterstack.com/docs/uptime/api/create-a-new-monitor/
 */

const API = "https://uptime.betterstack.com/api/v2";
const PROD = "https://slj.talksfromthewarehouse.co.uk";

type MonitorAttrs = {
  url?: string;
  pronounceable_name?: string;
};

async function api(
  token: string,
  method: string,
  path: string,
  body?: unknown
): Promise<{ ok: boolean; status: number; json: unknown }> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

async function listMonitors(token: string): Promise<
  Array<{ id: string; attributes: MonitorAttrs }>
> {
  const { ok, json } = await api(token, "GET", "/monitors");
  if (!ok) {
    throw new Error(`List monitors failed: ${JSON.stringify(json)}`);
  }
  const data = (json as { data?: Array<{ id: string; attributes: MonitorAttrs }> })
    .data;
  return data ?? [];
}

async function ensureMonitor(
  token: string,
  existing: Array<{ id: string; attributes: MonitorAttrs }>,
  spec: {
    name: string;
    url: string;
    check_frequency: number;
  }
) {
  const found = existing.find(
    (m) => m.attributes.pronounceable_name === spec.name
  );
  const payload = {
    monitor_type: "status",
    url: spec.url,
    pronounceable_name: spec.name,
    check_frequency: spec.check_frequency,
    request_timeout: 30,
    confirmation_period: 60,
    recovery_period: 60,
    email: true,
    sms: false,
    call: false,
  };

  if (found) {
    const { ok, status, json } = await api(
      token,
      "PATCH",
      `/monitors/${found.id}`,
      payload
    );
    console.log(
      ok
        ? `Updated monitor "${spec.name}" (${found.id})`
        : `Failed update "${spec.name}" HTTP ${status}: ${JSON.stringify(json)}`
    );
    return;
  }

  const { ok, status, json } = await api(token, "POST", "/monitors", payload);
  console.log(
    ok
      ? `Created monitor "${spec.name}"`
      : `Failed create "${spec.name}" HTTP ${status}: ${JSON.stringify(json)}`
  );
}

async function main() {
  const token = process.env.BETTER_STACK_UPTIME_API_TOKEN?.trim();
  if (!token) {
    console.error(
      "Set BETTER_STACK_UPTIME_API_TOKEN (Better Stack → Settings → API tokens)."
    );
    process.exit(1);
  }

  const existing = await listMonitors(token);
  console.log(`Found ${existing.length} existing monitor(s).`);

  await ensureMonitor(token, existing, {
    name: "SLJ production homepage",
    url: `${PROD}/`,
    check_frequency: 180,
  });
  // DB probe — low frequency so Neon can scale to zero between checks.
  await ensureMonitor(token, existing, {
    name: "SLJ production database",
    url: `${PROD}/api/health/db`,
    check_frequency: 600,
  });

  // Retire legacy monitor that pinged /api/health every 60s (kept Neon awake 24/7).
  const legacy = existing.find(
    (m) => m.attributes.pronounceable_name === "SLJ production health"
  );
  if (legacy) {
    const { ok, status } = await api(token, "DELETE", `/monitors/${legacy.id}`);
    console.log(
      ok
        ? `Removed legacy monitor "SLJ production health" (${legacy.id})`
        : `Failed remove legacy monitor HTTP ${status}`
    );
  }

  console.log("Done. Install the Better Stack mobile app for push alerts.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
