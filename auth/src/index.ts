import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import register from "./routes/register";
import login from "./routes/login";
import me from "./routes/me";

dotenv.config();
const app = express();

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

app.use("/register", register);
app.use("/login", login);
app.use("/me", me);

const port = process.env.PORT || 3001;
app.listen(port, () =>
  console.log(`Auth service running on http://localhost:${port}`)
);
