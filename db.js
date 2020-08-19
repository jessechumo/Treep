const dotenv = require('dotenv')
dotenv.config()
const mongodb = require('mongodb')
const connectionString =' mongodb+srv://todoAppUser:Kiprotich254@cluster0-eawpi.mongodb.net/Treep?retryWrites=true&w=majority'
mongodb.connect(process.env.CONNECTIONSTRING,{useNewUrlParser:true,useUnifiedTopology:true},function(err,client) {
 module.exports = client   
 const app = require('./app')
 app.listen(process.env.PORT)
})