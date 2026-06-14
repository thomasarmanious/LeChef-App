const jwt = require('jsonwebtoken');

exports.adminMiddleware = (req, res, next) => {
    const { token } = req.headers;
    
    if (!token) {
        return res.status(403).json({ error: 'Access denied. No token provided.' });
    }
    
    try {
        const decoded = jwt.verify(token, 'your_secret_key'); // Replace 'your_secret_key' with your actual secret key
        req.user = decoded;

        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admins only.' });
        }
        next();
    } catch (error) {
        return res.status(400).json({ error: 'Invalid token.' });
    }
};
