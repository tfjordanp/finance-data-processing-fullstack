import request from "supertest";
import app from "../../src/app";
import { AppDataSource } from "../../src/data-source";

describe("Rate Limiting Integration Tests", () => {
  
  beforeAll(async () => {
    // We do NOT call AppDataSource.initialize() if we only want to test 
    // the middleware layer, but usually, it's safer to have it ready.
    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }
    process.env.SKIP_RATE_LIMITING = "false";
  });

  afterAll(async () => {
    await AppDataSource.destroy();
    process.env.SKIP_RATE_LIMITING = undefined;
  });

  it("should block requests after exceeding the limit (429)", async () => {
    /** * Note: If your middleware has 'skip: () => process.env.NODE_ENV === "test"',
     * you may need to temporarily set it to something else:
     */
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production"; 

    const loginData = { email: "any@test.com", password: "password123" };
    const limit = 15;

    // 1. Send requests up to the limit
    for (let i = 0; i < limit; i++) {
      const res = await request(app).post("/api/auth/login").send(loginData);
      // We expect 401 (Unauthorized) because the user doesn't exist, 
      // but the important part is that it's NOT 429 yet.
      expect(res.status).not.toBe(429);
    }

    // 2. The next request should be blocked
    const blockedRes = await request(app).post("/api/auth/login").send(loginData);
    
    expect(blockedRes.status).toBe(429);
    expect(blockedRes.body.message).toMatch(/Too many login attempts/);
  });

  it("should return RateLimit headers", async () => {
    const res = await request(app).get("/api/dashboard");
    
    // express-rate-limit sets these when standardHeaders: true
    expect(res.headers).toHaveProperty("ratelimit-limit");
    expect(res.headers).toHaveProperty("ratelimit-remaining");
 });
});