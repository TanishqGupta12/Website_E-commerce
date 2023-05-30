var express = require('express');
var app = express();
var cookieParser = require("cookie-parser");
const bodyParserz = require("body-parser");


const cors = require("cors")
app.use(cors())

//  handling uncought exception

const port = process.env.Port || 4000

process.on("uncaughtException",(err)=>{
    console.log(`Error : ${err.message}` );
    console.log(`Error : ${err.stack}` );
    console.log(`Shutting down the server  due to  unhandler promise` );
})

app.use(express.json())
app.use(bodyParserz.json())
app.use(cookieParser())
app.use(bodyParserz.urlencoded({ extended : true }));

app.use("/api/v1" ,  require("./Router/producder_router"))
app.use("/api/v1" , require("./Router/user_router"))
// app.use("/api/v1" , require("./Router/order_router"))

app.use(require("./middleware/err"))

app.get("/" , (req , res)=>{
    res.send("dvnn")

});


 const server = app.listen(port ,()=>{
    console.log(`http://localhost:${port}/ `);
})

process.on("unhandledRejection" , (err)=>{
    console.log(`Error : ${err.message}` );
    console.log(`Shutting down the server  due to unhandled Rejection` );

    server.closeAllConnections(()=>{
        process.exit(1)
    })


})
