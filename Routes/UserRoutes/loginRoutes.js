const express = require('express');
const router=express.Router();

const { loginUser } = require('../../Controllers/User/UserAuth/UserAuthentication'); 


router.route('/login').post(loginUser);

module.exports=router;