import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import register from "./routes/register";
import login from "./routes/login";
import refresh from "./routes/refresh";
import verify from "./routes/verify";
import me from "./routes/me";
import health from "./routes/health";
import users from "./routes/users";
import { RefreshTokenService } from "./lib/refresh-token-service";

dotenv.config();
const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = ["http://localhost:3000", "http://localhost:3002"];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true
  })
);
app.use(express.json());

app.use("/health", health);
app.use("/register", register);
app.use("/login", login);
app.use("/refresh", refresh);
app.use("/verify", verify);
app.use("/me", me);
app.use("/users", users);

app.get("/", (req, res) => {
  res.json({ service: "auth", status: "running" });
});

setInterval(async () => {
  try {
    console.log("[CLEANUP] Starting cleanup of expired refresh tokens");
    await RefreshTokenService.cleanupExpiredTokens();
    console.log("[CLEANUP] Cleanup completed successfully");
  } catch (error) {
    console.error("[CLEANUP] Error during token cleanup:", error);
  }
}, 60 * 60 * 1000);

const port = process.env.PORT || 3001;
app.listen(port, () =>
  console.log(`Auth service running on http://localhost:${port}`)
);