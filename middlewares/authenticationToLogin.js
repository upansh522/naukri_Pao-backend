const { validateToken } = require("../services/user");

function checkAuthentication(cookieName) {
    return (req, res, next) => {
        const tokenCookieValue = req.cookies[cookieName];
        if (!tokenCookieValue) {
            return next();
        }

        try {
            const UserPayload = validateToken(tokenCookieValue);
            req.user = UserPayload;
            res.locals.UserInfo = UserPayload; // Set UserInfo in locals
        } catch (error) {
            console.error('Error validating token:', error);
            req.user = null;
        }
        next();
    };
}

module.exports = checkAuthentication;