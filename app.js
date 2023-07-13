require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();
app.use(express.static("public"));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));

mongoose.connect("mongodb+srv://japsinnaseem:"+process.env.MONGODBPASS+"@cluster0.c9xlloe.mongodb.net/userDB",{useNewUrlParser:true},{ useUnifiedTopology: true });

const userSchema = new mongoose.Schema({userName:String,password:String});
userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]});
const User = new mongoose.model("users",userSchema);

app.get("/",function(req,res){
    res.render("home");
})

app.get("/login",function(req,res){
    res.render("login");
})

app.get("/register",function(req,res){
    res.render("register");
})

app.post("/login",function(req,res){
    //get username and password and check if it exist
    console.log(req.body.username);
    console.log(req.body.password);
    User.findOne({userName:req.body.username},function(err,returnedUser){
        if(!err){
            if(returnedUser._doc.password===req.body.password){
                res.render("secrets");
            }
            else{
                res.send("user not found, Please register");
                res.render("register");
            }
        }
        else{
            res.send(err);
        }
    })
})

app.post("/register",function(req,res){
    //get username and password and check if it exist
    console.log(req.body.username);
    console.log(req.body.password);
    User.findOne({userName:req.body.username},function(err,foundUser){
        if(foundUser){
            console.log("An user with same username exist, Please login");
            res.render("register");
        }else if(err){
            res.send(err)
        }else{
            const thisUser = new User({userName:req.body.username,password:req.body.password})
            thisUser.save();
            res.render("login");
        }
    })
})


app.listen(3000,function(){
    console.log("Up and running on port 3000");
})




