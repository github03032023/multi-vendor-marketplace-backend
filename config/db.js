const mongoose = require("mongoose");

const connectDb = async () =>{
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI_STRING);
        console.log(`Mongo Db Connected : ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error:${error.message}`);
        process.exit(1);
        
    }
};

module.exports = connectDb;