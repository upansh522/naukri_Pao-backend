const jwt=require("jsonwebtoken");
require('dotenv').config();
const Secret_key=process.env.SECERET_KEY;

function createToken(user)
{
    const payload={
        _id: user.id,        
    }

    const token=jwt.sign(payload,Secret_key);   
    return token;
}

function validateToken(token){
    const payload=jwt.verify(token,Secret_key);
    return payload;
}

module.exports={createToken,
    validateToken
}