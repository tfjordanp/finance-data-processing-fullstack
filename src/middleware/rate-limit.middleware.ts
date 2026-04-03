import rateLimit from "express-rate-limit";

const skip = () => process.env.NODE_ENV === "test" && process.env.SKIP_RATE_LIMITING !== "false";   // Skip rate limiting in test environment

// General rule: 100 requests every 15 minutes per IP
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip, // Skip rate limiting in test environment
});

// Strict rule for Auth: Only 15 login attempts per hour
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  message: {
    success: false,
    message: "Too many login attempts. Please try again in an hour.",
  },
  skip, // Skip rate limiting in test environment
});