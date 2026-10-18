import mongoose , {Document, Schema, Model} from "mongoose"
import bcrypt from "bcryptjs"


export interface IUser extends Document {
    name:string,
    email:string,
    password:string,
    careatedAt:Date;
    updatedAt:Date;
    matchPassword(enteredPassword:string): Promise<boolean>
}


const userSchema = new Schema<IUser>(
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


userSchema.pre<IUser>("save", async function(){
    if(!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10)
})

userSchema.methods.matchPassword = async function (
  enteredPassword: string
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};



export const User : Model<IUser> = mongoose.model<IUser>("User", userSchema)