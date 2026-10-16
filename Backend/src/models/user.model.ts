import mongoose , {Document, Schema, Model} from "mongoose"
import bcrypt from "bcryptjs"


export interface User extends Document {
    name:string,
    email:string,
    password:string,
    careatedAt:Date;
    updatedAt:Date;
    matchPassword(enteredPassword:string): Promise<boolean>
}


const userSchema = new Schema<User>(
    {
        name:{
            type:String,
            required:true,
            trim:true,
            maxlenght:50,
        },

        email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
        },
        password:{
            type:String,
            required:true,
            minlenghth:6,
            
        }
    },

    {timestamps:true}
)