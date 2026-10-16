import mongose from "mongoose"

const connectDB = async (): Promise<void>=>{
    try {
        const MONGODB_URI = process.env.MONGODB_URI;

        if(!MONGODB_URI){
            throw new Error("Mongodb URI is messing!")
        }

        const connection = await mongose.connect( MONGODB_URI);
        console.log("MongoDB connected successfully");
        
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
           process.exit(1)
        
    }
}

export default connectDB