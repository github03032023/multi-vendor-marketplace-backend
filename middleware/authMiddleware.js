const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        const authHeader  = req.header('Authorization');
      

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                statusCode: 401,
                message: "Authorization token is missing or invalid"
            });
        }

        const token = authHeader.replace('Bearer ', '');

        // decrypting jwt_token
        const decryptedToken = jwt.verify(token, process.env.JWT_SECRET);

        if (decryptedToken && decryptedToken?.userId) {
            req.userId = decryptedToken.userId;
            req.role = decryptedToken.role; 
            next();
        }else if (decryptedToken && decryptedToken?.vendorId) {
            req.vendorId = decryptedToken.vendorId;
            next();
        }
        else {
            return res.status(401).json({
                success: false,
                statusCode: 401,
                message: "Not Authorized"
            })
        }
    } catch (err) {
        console.log("Error in authMiddleware:", err);
        return res.status(401).json({
            success: false,
            statusCode: 401,
            message: "Invalid or Expired Token"
        })
    }
}

module.exports = authMiddleware;