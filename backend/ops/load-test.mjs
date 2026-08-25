const baseUrl = (process.env.LOAD_TEST_BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");
const concurrency = Number(process.env.LOAD_TEST_CONCURRENCY || 20);
const total = Number(process.env.LOAD_TEST_REQUESTS || 200);
const testAi = process.env.LOAD_TEST_AI === "1";

if (!Number.isInteger(concurrency) || concurrency < 1 || !Number.isInteger(total) || total < 1) {
  throw new Error("LOAD_TEST_CONCURRENCY and LOAD_TEST_REQUESTS must be positive integers");
}

let cursor = 0;
let failures = 0;
const durations = [];

async function oneRequest(index) {
  const started = performance.now();
  const response = testAi
    ? await fetch(`${baseUrl}/api/reviews/generate`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": `loadtest-${Date.now()}-${index}`,
        },
        body: JSON.stringify({
          provider: "local-template",
          model: "",
          merchantId: "liji",
          storeId: "liji-main",
          input: { dishes: ["bone-soup"], tags: ["broth"], message: "" },
        }),
      })
    : await fetch(`${baseUrl}/api/merchants/liji?storeId=liji-main`);

  durations.push(performance.now() - started);
  if (!response.ok) failures += 1;
  await response.arrayBuffer();
}

async function worker() {
  while (true) {
    const index = cursor++;
    if (index >= total) return;
    try {
      await oneRequest(index);
    } catch {
      failures += 1;
    }
  }
}

await Promise.all(Array.from({ length: Math.min(concurrency, total) }, () => worker()));
durations.sort((a, b) => a - b);
const percentile = (p) => durations[Math.min(durations.length - 1, Math.floor(durations.length * p))] || 0;
const average = durations.length ? durations.reduce((sum, value) => sum + value, 0) / durations.length : 0;

console.log(JSON.stringify({
  target: testAi ? "local-template AI generation" : "merchant scan/config",
  total,
  concurrency,
  success: total - failures,
  failures,
  averageMs: Math.round(average),
  p50Ms: Math.round(percentile(0.5)),
  p95Ms: Math.round(percentile(0.95)),
  p99Ms: Math.round(percentile(0.99)),
}, null, 2));

if (failures > 0) process.exitCode = 1;
