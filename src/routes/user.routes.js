import { Router } from "express"
import { registerUser,
         login, 
         getMyProfile,
         logout,
         searchUser 
        } from "../controllers/user.controllers.js";
import { multerUpload } from "../middlewares/multer.js"
import { isAuthenticated } from "../middlewares/auth.js";

const app = Router();

app.post("/register",multerUpload.single("avatar"), registerUser)
app.post("/login",login)

// after this router user must be logged in.

app.use(isAuthenticated);

app.get("/me",getMyProfile);

app.get("/logout",logout);

app.get("/search",searchUser);

export default app

