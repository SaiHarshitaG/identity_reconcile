import express from "express";
import dotenv from "dotenv";
import contactRoutes from "./modules/contact/contact.routes";
import { errorMiddleware } from "./middlewares/error.middleware";

dotenv.config();

const app = express();

app.use(express.json());

// Routes
app.use(contactRoutes);

app.get("/", (_req, res) => {
  res.send("Bitespeed Identity Reconciliation API running ");
});

// Error middleware (must be LAST)
app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});