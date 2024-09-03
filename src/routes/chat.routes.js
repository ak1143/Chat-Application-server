import { Router } from "express"
import { isAuthenticated } from "../middlewares/auth.js";
import { 
        myGroups, 
        newGroupChat, 
        myChats, 
        addMembers, 
        removeMember,
        leaveGroup, 
        sendAttachment, 
        getChatDetails,
        renameGroup,      
        deleteChat,
        getMessages
    } from "../controllers/chat.controllers.js";
import { attachmentMulter } from "../middlewares/multer.js";

const app = Router();

// after this router user must be logged in.

app.use(isAuthenticated);

app.post("/new-group",newGroupChat);

app.get("/my-chat",myChats);

app.get("/my-groups",myGroups);

app.put("/add-members",addMembers);

app.put("/remove-member",removeMember);

app.delete("/leave/:id",leaveGroup);

app.post("/message",attachmentMulter,sendAttachment);

app.get("/message/:id",getMessages);

app.route("/:id").get(getChatDetails).put(renameGroup).delete(deleteChat);

export default app

