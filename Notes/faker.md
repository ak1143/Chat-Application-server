
# Dummy data:

### To get dummy data we use faker library. 


```js
import { User } from "../models/user.models.js";
import { faker } from "@faker-js/faker"

const crateUser = async (numUsers) => {
    try {
        
        const usersPromise = []; 

        for(let i=0;i<numUsers;i++){
            const tempUser = User.create({
                name : faker.person.fullName(),       // fake name.
                username : faker.internet.userName(), // fake username.
                bio : faker.lorem.sentence(10),       // fake bio.
                password : "password",                // fake password.
                avatar : {                            // fake avatar.
                    url : faker.image.avatar(),
                    public_id : faker.system.fileName()
                }
            });
            usersPromise.push(tempUser)
        }

        await Promise.all(usersPromise);  // all the promises while creating document must be resolve.
 
        console.log("users created",numUsers);
        process.exit(1); // to terminate the process of nodejs

    } catch (error) {
        console.log("error occured at creating seeders:",error)
    }
}

export {crateUser}```
 
