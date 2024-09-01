import { Router } from "express"
import { isAuthenticated } from "../middlewares/auth.js";

const app = Router();

// after this router user must be logged in.

app.use(isAuthenticated);


export default app

