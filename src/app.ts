import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import "express-async-errors";
import routes from "./routes";
import { errorHandler } from "./middleware/error.middleware";
import { generalLimiter } from "./middleware/rate-limit.middleware";

const app = express();

/**
 * the ip seen by the general rate limiter may not be the actual client ip if the app is behind a proxy or load balancer.
 * in production, you should configure your proxy/load balancer to forward the client ip using the X-Forwarded-For header and set app.set('trust proxy', true) in your express app.
 * for development, you can use a tool like ngrok to expose your local server and get the real client ip.
 */
app.use(generalLimiter);
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.use("/api", routes);

app.get("/", (req, res) => {
  res.send("Finance Data Processing API is running");
});

app.use(errorHandler);

export default app;
