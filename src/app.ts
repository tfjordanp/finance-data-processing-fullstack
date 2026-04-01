import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import "express-async-errors";
import routes from "./routes";
import { errorHandler } from "./middleware/error.middleware";

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.use("/api", routes);

app.get("/", (req, res) => {
  res.send("Finance Data Processing API (first iteration)");
});

app.use(errorHandler);

export default app;
