import * as authService from "../../src/services/auth.service";

describe("Auth Service Unit Tests", () => {
  describe("hashPassword / comparePassword", () => {
    it("should hash and compare correctly", async () => {
      const plain = "P@ssw0rd";
      const hashed = await authService.hashPassword(plain);
      expect(typeof hashed).toBe("string");
      const valid = await authService.comparePassword(plain, hashed);
      expect(valid).toBe(true);
    });
  });

  describe("JWT sign/verify", () => {
    it("should sign and verify payload", () => {
      const payload = { userId: "abcd" };
      const token = authService.signToken(payload);
      expect(typeof token).toBe("string");
      const decoded = authService.verifyToken(token);
      expect(decoded).toEqual(expect.objectContaining(payload));
      expect(decoded).toHaveProperty("iat");
      expect(decoded).toHaveProperty("exp");
    });

    it("should throw for invalid token", () => {
      expect(() => authService.verifyToken("bad.token.here")).toThrow();
    });
  });
});