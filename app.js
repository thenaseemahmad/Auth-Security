require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const md5 = require("md5");
const session = require("express-session");
const passport=require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static("public"));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));

app.use(session({
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:true,
    //cookie:{secure:true}
}))



app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://japsinnaseem:"+process.env.MONGODBPASS+"@cluster0.c9xlloe.mongodb.net/userDB",{useNewUrlParser:true},{ useUnifiedTopology: true },{useCreateIndex:true});

const userSchema = new mongoose.Schema({username:String,password:String});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("users",userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/",function(req,res){
    res.render("home");
});

app.get("/login",function(req,res){
    res.render("login");
});

app.get("/register",function(req,res){
    res.render("register");
});

app.get("/secrets",function(req,res){
    if(req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.redirect("login");
    }
});

app.get("/logout",function(req,res){
    req.logout(function(err){
        res.redirect("/");
    });
    
}); 

app.get("/auth/google",function(req,res){
    passport.authenticate("google",{scope:["profile"]});
});

app.get("/auth/google/secrets",
  passportauthenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/secrets");
  });

app.post("/login",function(req,res){
    const thisUser = new User({
        username:req.body.username,
        password:req.body.password
    })
    req.login(thisUser,function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }
    })
});

app.post("/register",function(req,res){
    User.register({username:req.body.username},req.body.password,function(err, registeredUser){
        if(err){
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    });
});


app.listen(3000,function(){
    console.log("Up and running on port 3000");
})




