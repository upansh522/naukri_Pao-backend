const express= require('express');
const routers=express.Router();
const {handleSignup,handleLogin}=require('../controllers/user');

routers.post('/handleUserSignup',handleSignup)
routers.post('/handleUserLogin',handleLogin);

module.exports= routers