var jwt = require('jsonwebtoken');
function verifyJWT(jwtToken = "") {
    try {
        let isVerified = false
        jwt.verify(jwtToken, process.env.SECRET_KEY, (err, token) => {
            if (token == undefined) {
                isVerified = false
            }
            else {
                isVerified = true
            }
        })
        return isVerified
    } catch (error) {
        return false
    }
};

module.exports = { verifyJWT }