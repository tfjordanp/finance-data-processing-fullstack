import request from "supertest";
import app from "../../src/app";
import { AppDataSource } from "../../src/data-source";
import { Category } from "../../src/models/Category";
import { User } from "../../src/models/User";
import { hashPassword } from "../../src/services/auth.service";

describe("Category Integration Tests", () => {
  let token: string;

  beforeEach(async () => {
    await AppDataSource.initialize();
    await AppDataSource.synchronize(true);

    const categoryRepo = AppDataSource.getRepository(Category);
    await categoryRepo.save(categoryRepo.create({ name: "Food" }));
    await categoryRepo.save(categoryRepo.create({ name: "Travel" }));

    const userRepo = AppDataSource.getRepository(User);
    const hashed = await hashPassword("pass123");
    await userRepo.save(userRepo.create({ email: "catuser@example.com", password: hashed, dateOfBirth: "1990-01-01", gender: "male", isActive: true, role: "admin" }));

    const login = await request(app).post("/api/auth/login").send({ email: "catuser@example.com", password: "pass123" });
    expect(login.status).toEqual(200);
    token = login.body.token;
  });

  afterEach(async () => {
    await AppDataSource.destroy();
  });

  it("should list categories", async () => {
    const res = await request(app).get("/api/categories").set("Authorization", `Bearer ${token}`);
    expect(res.status).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toEqual(expect.arrayContaining([expect.objectContaining({ name: "Food" }), expect.objectContaining({ name: "Travel" })]));
  });

  it("should return 401 when unauthorized", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.status).toEqual(401);
  });
});