const express = require("express");
const apiroute = require("./routes/route");

const app = express();

const PORT = process.env.PORT || 3000;


app.use(express.json());
app.use("/api", apiroute);
app.listen(PORT,() => {
    console.log("Hello Daraco the server is running in port : " + PORT);   
});
