import dotenv from "dotenv";
import app from "./app";
import { AppDataSource } from "./data-source";
import { Category } from "./models/Category";
import { User } from "./models/User";
import { hashPassword } from "./services/auth.service";

dotenv.config();

const port = Number(process.env.PORT || 4000);

AppDataSource.initialize()
  .then(async () => {
    console.log("Data source initialized.");

    const categoryRepo = AppDataSource.getRepository(Category);
    const defaults = ["Food", "Transport", "Utilities", "Salary", "Entertainment"];
    for (const name of defaults) {
      const exists = await categoryRepo.findOne({ where: { name } });
      if (!exists) {
        await categoryRepo.save({ name });
      }
    }

    const userRepo = AppDataSource.getRepository(User);
    const defaultEmail = process.env.DEFAULT_USER_EMAIL || "admin@example.com";
    const defaultPassword = process.env.DEFAULT_USER_PASSWORD || "password123";
    let defaultUser = await userRepo.findOne({ where: { email: defaultEmail } });
    if (!defaultUser) {
      defaultUser = userRepo.create({
        email: defaultEmail,
        password: await hashPassword(defaultPassword),
        dateOfBirth: "1990-01-01",
        gender: 'male',
        isActive: true,
        role: "admin"
      });
      await userRepo.save(defaultUser);
      console.log(`Default user created: ${defaultEmail} / ${defaultPassword}`);
    } else {
      console.log(`Default user exists: ${defaultEmail}`);
    }

    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Error during Data Source initialization", error);
    process.exit(1);
  });
