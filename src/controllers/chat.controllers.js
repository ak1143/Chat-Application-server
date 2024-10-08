import { ALERT, NEW_ATTACHMENT, NEW_MESSAGE_ALERT, REFETCH_CHATS } from "../constants/event.js";
import { getOtherMember } from "../lib/helper.js";
import { TryCatch } from "../middlewares/error.js";
import { Message } from "../models/message.models.js"
import { Chat } from "../models/chat.models.js";
import { User } from "../models/user.models.js";
import { Errorhandler } from "../utils/ErrorHandler.js";
import { deleteFilesFromCloudinary, emitEvent } from "../utils/features.js";


const newGroupChat = TryCatch( async (req,res,next)=>{

    /* steps to create new groupchat:
        step 1: take name of group and also the members.
        step 2: create the document in chat
        step 3: emit the event.
    */
    const {name, members} = req.body;

    if(members.length < 2){
        return next(new Errorhandler("Group chat must have at least 3 members",400));
    }

    const allMembers = [...members,req.user];

    const chat = await Chat.create({
        name,
        groupChat : true,
        creator : req.user,
        members : allMembers
    });

    console.log(chat)

    emitEvent(req,ALERT,allMembers,`Welcome to ${name} group chat`);
    emitEvent(req,REFETCH_CHATS,members);

    return res
        .status(201)
        .json({
            success :true ,
            message : "Group created"
        });

});

const myChats = TryCatch( async(req,res,next)=>{

    const chats = await Chat.find({ members : req.user}).populate("members","name avatar");

    const transformedChats = chats.map(( {_id, name, members, groupChat} )=>{

        const otherMember = getOtherMember(members, req.user);

        return {
            _id,
            groupChat,
            avatar: groupChat ? members.slice(0,3).map( ({avatar}) => avatar.url ) :(
                [otherMember.avatar.url]
            ),
            name : groupChat ? name : otherMember.name,
            members : members.reduce( (prev,curr)=>{
                if( curr._id.toString() !== req.user.toString()){
                    prev.push(curr._id.toString());
                }
                return prev;
            }, [])
        }
    })

    return res
        .status(200)
        .json({
            success:true,
            chat : transformedChats
        });
});


const myGroups = TryCatch ( async(req,res,next)=>{
    const chats = await Chat.find({
        members : req.user,
        groupChat : true
    }).populate("members","name avatar");

    const groups = chats.map( ({members,_id,groupChat,name}) => ({
        _id,
        name,
        groupChat,
        avatar :  members.slice(0,3).map( ({avatar}) => avatar.url )
    }));

    return res
        .status(200)
        .json({
            success: true,
            groups
        });
});

const addMembers = TryCatch( async(req,res,next)=>{

    /*  steps: to add member in group.
        1. take chatId amd members as input apply validation.
        2. find the chat with chatId.
        3. apply the necessary checks.
        4. apply filter to avoid the duplication of user.
        5. push the member in the db.
    */

    const {chatId, members} = req.body;

    if(!members || members.length < 1) return next(new Errorhandler("please provide members",400))

    const chat = await Chat.findById(chatId);

    if(!chat) return next(new Errorhandler("chat not found",404));

    if(!chat.groupChat) return next(new Errorhandler("It is not a group chat",400)); 

    if( chat.creator.toString() !== req.user ) {
        return next(new Errorhandler("You are not allowed to add member",403));
    }

    const allNewMembersPromise = members.map( i=> User.findById(i));

    const allNewMembers = await Promise.all(allNewMembersPromise);

    const uniqueMembers = allNewMembers
        .filter((i)=>!chat.members.includes(i._id.toString()))
        .map((i)=>i._id);
    

    chat.members.push(...uniqueMembers.map((i)=>i._id));

    if(chat.members.length > 100) return next(new Errorhandler("Group member limit reached",400));
        
    await chat.save();

    const allUsersName = allNewMembers.map( (i)=>i.name).join(",")

    emitEvent(
        req,
        ALERT,
        chat.members,
        `${allUsersName} has been added in the group`
    );

    emitEvent( req, REFETCH_CHATS, chat.members);


    return res
        .status(200)
        .json({
            success : true,
            message : 'Members are added successfully'
        })
});

const removeMember = TryCatch( async(req,res,next)=>{

    const { chatId, userId } = req.body; //userid: the id that needs to be removed.

    const [ chat, user] = await Promise.all([
        Chat.findById(chatId),
        User.findById(userId,"name")
    ]);

    if(!chat) return next(new Errorhandler("chat not found",404));

    if(!chat.groupChat) return next(new Errorhandler("It is not a group chat",400));    

    if(chat.creator.toString() !== req.user) {
        return next(new Errorhandler("You are not allowed to add member",403));
    }

    if(chat.members.length <= 3){
        return next(new Errorhandler("Group must have at least 3 members",400));
    }

    chat.members = chat.members.filter( (member)=> member.toString() !== userId );  
    //userId.toString is not allowed.
 
    await chat.save();

    emitEvent(
        req,
        ALERT,
        chat.members,
        `${user.name} has been removed`
    );

    emitEvent(req,REFETCH_CHATS,chat.members);

    return res
        .status(200)
        .json({
            success : true,
            message : "user has been removed successfully."
        })
});

const leaveGroup = TryCatch( async(req,res,next)=>{

    const chatId = req.params.id;

    const chat = Chat.findById(chatId)

    if(!chat) return next(new Errorhandler("chat not found",404));

    if(!chat.groupChat) return next(new Errorhandler("It is not a group chat",400));  

    const remainingMembers = chat.members.filter( 
        (member)=> member.toStirng() !== req.user.toStirng());

    if(remainingMembers.length < 2) return next(
        new Errorhandler ("group must have atleast 3 members",400)
    );

    if(chat.creator.toStirng()===req.user.toStirng()){
        const newCreator = remainingMembers[0];

        chat.creator = newCreator
    }

    chat.members = remainingMembers

    const [user] = Promise.all([
        User.findById(req.user,"name"),
        chat.save()  
    ]);

    emitEvent(
        req,
        ALERT,
        chat.members,
        `User ${user.name} has left the chat`
    );

    emitEvent(req, REFETCH_CHATS, chat.members);

    return res
        .status(200)
        .json({
            success : true,
            message : "user has been removed successfully."
        })
});

const sendAttachment = TryCatch( async(req,res,next)=>{
    
    const { chatId } = req.body;

    const [chat, user] = await Promise.all([
        Chat.findById(chatId),
        User.findById(req.user,"name")
    ]);

    if(!chat) return next(new Errorhandler("chat not found",404));
    
    const files = req.files || [];

    if(files.length < 1) 
        return next(new Errorhandler("Please provide attachments",400));

    // As soon as you get attachment then upload it on cloudinary.

    const attachments = [];

    const messageForDB = {
        content : "",
        attachments,
        sender : user._id,
        chat : chatId
    }

    const messageForRealTime = {
        ...messageForDB,
        sender : {
            _id : user._id,
            name : user.name
        }
    };

    const message = await Message.create(messageForDB)

    emitEvent(req,NEW_ATTACHMENT,chat.members,{
        message : messageForRealTime,
        chatId
    });

    emitEvent(req,NEW_MESSAGE_ALERT,chat.members,chatId);

    return res
        .status(200)
        .json({
            success : true,
            message 
        });
});

const getChatDetails = TryCatch( async(req,res,next)=>{

    if(req.query.populate === "true"){
            
        const chat = await Chat.findById(req.params.id)
                               .populate("members","name avatar")
                               .lean();
    /* 
        ## lean(): it converts the object into classic javascript then the changes will be modified
                   and saved without making changes in the databases.
    */ 
        if(!chat) return next(new Errorhandler("Chat not found",404));

        chat.members = chat.members.map( ({_id, name, avatar}) => (
            {   _id,
                name,
                avatar : avatar.url 
            }
        ));
        return res
            .status(200)
            .json({
                success : true,
                chat
            });

    }else{
        const chat = await Chat.findById(req.params.id);
        if(!chat) return next(new Errorhandler("chat not found",404));

        return res
            .status(200)
            .json({
                success : true,
                chat
            });
    }
});

const renameGroup = TryCatch( async(req,res,next)=>{

    const { groupName } = req.body;

    const chatId = req.params.id;

    if(!groupName || !groupName.length>1) return next(new Errorhandler("please provide groupname"));

    const user = await User.findById(req.user);

    if(!user) return next(new Errorhandler("user not found",404));

    const chat = await Chat.findById(chatId);

    if(!chat) return next(new Errorhandler("chat not found",404));

    if(req.user !== chat.creator.toString()) return next("you are not allowed to change group name",401);

    if(!chat.groupChat) return next(new Errorhandler("this is not a group",404));

    chat.name = groupName;

    await chat.save();

    emitEvent( req, REFETCH_CHATS, chat.members);

    return res 
        .status(200)
        .json({
            success : true,
            message : "group name changed successfully"
        });
});

const deleteChat = TryCatch( async(req,res,next)=>{

    const chatId = req.params.id;

    const chat = await Chat.findById(chatId);

    if(!chat) return next(new Errorhandler("chat not found",404));

    const members = chat.members;

    if(chat.groupChat && chat.creator.toString() !== req.user.toString()){
        return next(new Errorhandler("You are not allowed to delete the group",403));
    }
    
    if(!chat.groupChat && !chat.members.includes(req.user)){
        return next(new Errorhandler("You are not allowed to delete the chat",403));
    }

    // Here we have to delete all messages as well as attachments from cloudinary.
    const messagesWithAttachments = await Message.find({
        chat : chatId,
        attachments : { $exists : true, $ne : []},
    });

    const public_ids = [];

    messagesWithAttachments.forEach(({attachments})=>
        attachments.forEach(({public_id}) => public_ids.push(public_id))
    );

    await Promise.all([
        deleteFilesFromCloudinary(public_ids),
        chat.deleteOne(),
        Message.deleteMany({ chat : chatId})
    ]);
    
    emitEvent( req, REFETCH_CHATS, members);

    return res 
        .status(200)
        .json({
            success : true,
            message : "chat deleted successfully."
        });
});

const getMessages = TryCatch( async(req,res,next)=>{
    const chatId = req.params.id;
    const { page = 1 } = req.query;

    const resultPerPage = 20;
    const skip = (page-1) * resultPerPage;

    const [messages, totalMessagesCount] = await Promise.all([
        Message.find({ chat : chatId})
         .sort({ createdAt : -1 })
         .skip(skip)
         .limit(resultPerPage)
         .populate("sender","name")
         .lean(),
        Message.countDocuments({ chat : chatId }),
    ]);

    const totalPages = Math.ceil(totalMessagesCount/resultPerPage);

    return res
        .status(200)
        .json({
            success : true,
            messages : messages.reverse(),
            totalPages
        });
});

export { 
    newGroupChat,
    myChats,
    myGroups,
    addMembers,
    removeMember,
    leaveGroup,
    sendAttachment,
    getChatDetails,
    renameGroup,
    deleteChat,
    getMessages
}