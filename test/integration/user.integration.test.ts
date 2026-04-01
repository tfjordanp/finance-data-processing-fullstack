import request from "supertest";
import app from "../../src/app";
import { AppDataSource } from "../../src/data-source";
import { User } from "../../src/models/User";
import { hashPassword } from "../../src/services/auth.service";

describe("User Integration Tests", () => {
  let userId: string;
  let token: string;
  const rawPassword = "MySecret123";

  beforeEach(async () => {
    await AppDataSource.initialize();
    await AppDataSource.synchronize(true);

    const userRepo = AppDataSource.getRepository(User);
    const hashedPassword = await hashPassword(rawPassword);
    const user = userRepo.create({
      email: "test@example.com",
      password: hashedPassword,
      dateOfBirth: "1990-02-15",
      gender: "male",
      isActive: true
    });
    const savedUser = await userRepo.save(user);
    userId = savedUser.id;

    const loginResp = await request(app).post("/api/auth/login").send({ email: "test@example.com", password: rawPassword });
    expect(loginResp.status).toEqual(200);
    token = loginResp.body.token;
  });

  afterEach(async () => {
    await AppDataSource.destroy();
  });

  it("should fail login with invalid credentials", async () => {
    const badLogin = await request(app).post("/api/auth/login").send({ email: "test@example.com", password: "bad" });
    expect(badLogin.status).toEqual(401);
  });

  it("should return current user profile via /me", async () => {
    const me = await request(app).get("/api/users/me").set("Authorization", `Bearer ${token}`);
    expect(me.status).toEqual(200);
    expect(me.body.email).toEqual("test@example.com");
  });

  it("should list users", async () => {
    const all = await request(app).get("/api/users").set("Authorization", `Bearer ${token}`);
    expect(all.status).toEqual(200);
    expect(Array.isArray(all.body)).toBe(true);
    expect(all.body.some((u: any) => u.email === "test@example.com")).toBe(true);
  });

  it("should get user by id", async () => {
    const one = await request(app).get(`/api/users/${userId}`).set("Authorization", `Bearer ${token}`);
    expect(one.status).toEqual(200);
    expect(one.body).toMatchObject({ email: "test@example.com", gender: "male", isActive: true });
  });

  it("should update user", async () => {
    const update = await request(app)
      .put(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ email: "test@example.com", password: rawPassword, dateOfBirth: "1990-05-05", gender: "other", isActive: false });
    expect(update.status).toEqual(200);
    expect(update.body).toMatchObject({ dateOfBirth: "1990-05-05", gender: "other", isActive: false });
  });

  it("should return 409 when updating to an email already in use", async () => {
    const createResp = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${token}`)
      .send({ email: "newuser@example.com", password: "NewPass123", dateOfBirth: "1995-08-20", gender: "female", isActive: true });
    expect(createResp.status).toEqual(201);

    const conflict = await request(app)
      .put(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ email: "newuser@example.com", password: rawPassword, dateOfBirth: "1990-05-05", gender: "other", isActive: false });

    expect(conflict.status).toEqual(409);
    expect(conflict.body.message).toMatch(/Email already in use/);
  });

  it("should delete user and protect endpoint afterward", async () => {
    const del = await request(app).delete(`/api/users/${userId}`).set("Authorization", `Bearer ${token}`);
    expect(del.status).toEqual(204);

    const afterDel = await request(app).get(`/api/users/${userId}`).set("Authorization", `Bearer ${token}`);
    expect(afterDel.status).toEqual(401);
  });

  it("should create a new user", async () => {
    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${token}`)
      .send({
        email: "newuser@example.com",
        password: "NewPass123",
        dateOfBirth: "1995-08-20",
        gender: "female",
        isActive: true
      });

    expect(res.status).toEqual(201);
    expect(res.body).toMatchObject({
      email: "newuser@example.com",
      dateOfBirth: "1995-08-20",
      gender: "female",
      isActive: true
    });

    // created user should be retrievable in list
    const all = await request(app).get("/api/users").set("Authorization", `Bearer ${token}`);
    expect(all.body.some((u: any) => u.email === "newuser@example.com")).toBe(true);
  });

  it("should return 400 when update user request is missing fields", async () => {
    const result = await request(app)
      .put(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ email: "test@example.com" });

    expect(result.status).toEqual(400);
    expect(result.body.message).toMatch(/All user fields are required/);
  });
});