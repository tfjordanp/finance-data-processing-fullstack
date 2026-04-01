import request from "supertest";
import app from "../../src/app";
import { AppDataSource } from "../../src/data-source";
import { User } from "../../src/models/User";
import { Category } from "../../src/models/Category";
import { hashPassword } from "../../src/services/auth.service";

describe("Transaction Integration Tests", () => {
  let token: string;
  let categoryId: string;

  beforeEach(async () => {
    await AppDataSource.initialize();
    await AppDataSource.synchronize(true);

    const categoryRepo = AppDataSource.getRepository(Category);
    const cat = categoryRepo.create({ name: "TestCategory" });
    const savedCat = await categoryRepo.save(cat);
    categoryId = savedCat.id;

    const userRepo = AppDataSource.getRepository(User);
    const rawPassword = "pwd123";
    const hashed = await hashPassword(rawPassword);
    const user = userRepo.create({ email: "txuser@example.com", password: hashed, dateOfBirth: "1991-03-03", gender: "male", isActive: true });
    await userRepo.save(user);

    const login = await request(app).post("/api/auth/login").send({ email: "txuser@example.com", password: rawPassword });
    expect(login.status).toEqual(200);
    token = login.body.token;
  });

  afterEach(async () => {
    await AppDataSource.destroy();
  });

  it("should create transaction", async () => {
    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 100, type: "income", categoryId, date: "2026-04-01", notes: "test" });

    expect(res.status).toEqual(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.category).toMatchObject({ id: categoryId });
  });

  it("should list transactions", async () => {
    const createRes = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 100, type: "income", categoryId, date: "2026-04-01", notes: "test" });
    expect(createRes.status).toEqual(201);
    const createdId = createRes.body.id;

    const res = await request(app).get("/api/transactions").set("Authorization", `Bearer ${token}`);
    expect(res.status).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((tx: any) => tx.id === createdId)).toBe(true);
  });

  it("should get single transaction", async () => {
    const createRes = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 100, type: "income", categoryId, date: "2026-04-01", notes: "test" });
    expect(createRes.status).toEqual(201);
    const createdId = createRes.body.id;

    const res = await request(app).get(`/api/transactions/${createdId}`).set("Authorization", `Bearer ${token}`);
    expect(res.status).toEqual(200);
    expect(res.body).toMatchObject({ id: createdId, type: "income" });
    expect(res.body.category).toMatchObject({ id: categoryId, name: "TestCategory" });
  });

  it("should update transaction", async () => {
    const createRes = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 100, type: "income", categoryId, date: "2026-04-01", notes: "test" });
    expect(createRes.status).toEqual(201);
    const createdId = createRes.body.id;

    const res = await request(app)
      .patch(`/api/transactions/${createdId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 250, notes: "updated note" });

    expect(res.status).toEqual(200);
    expect(res.body).toMatchObject({ id: createdId, amount: 250, notes: "updated note" });
  });

  it("should delete transaction and return 404 after deletion", async () => {
    const createRes = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 100, type: "income", categoryId, date: "2026-04-01", notes: "test" });
    expect(createRes.status).toEqual(201);
    const createdId = createRes.body.id;

    const del = await request(app).delete(`/api/transactions/${createdId}`).set("Authorization", `Bearer ${token}`);
    expect(del.status).toEqual(204);

    const after = await request(app).get(`/api/transactions/${createdId}`).set("Authorization", `Bearer ${token}`);
    expect(after.status).toEqual(404);
  });

  it("should return 400 for invalid transaction payload", async () => {
    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: "not-a-number", type: "income", categoryId, date: "2026-04-01", notes: "test" });

    expect(res.status).toEqual(400);
    expect(res.body.message).toMatch(/Invalid payload/);
  });

  it("should return 400 when date is in the future", async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const futureDate = tomorrow.toISOString().slice(0, 10);

    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 100, type: "income", categoryId, date: futureDate, notes: "future" });

    expect(res.status).toEqual(400);
    expect(res.body.message).toMatch(/Invalid payload/);

    const createRes = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 100, type: "income", categoryId, date: "2026-04-01", notes: "test" });
    expect(createRes.status).toEqual(201);
    const createdId = createRes.body.id;

    const patchRes = await request(app)
      .patch(`/api/transactions/${createdId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ date: futureDate });

    expect(patchRes.status).toEqual(400);
    expect(patchRes.body.message).toMatch(/Invalid payload/);
  });
});