const jwt = require('jsonwebtoken');
const User = require('../modules/UsersModule'); // Adjust the path as necessary

exports.authMiddleware = async (req, res, next) => {
    const { token } = req.headers;

    if (!token) {
        return res.status(403).json({ error: 'Access denied. No token provided.' });
    }

    try {
        // Verify the token using your secret key
        const decoded = jwt.verify(token, 'your_secret_key'); // Replace with your actual secret key

        // Fetch the user from the database using the userId (_id) from the token
        const user = await User.findById(decoded._id);

        if (!user) {
            return res.status(401).json({ message: 'Unauthorized: No user found' });
        }

        // Attach the full user object to the request
        req.user = user;

        // Proceed to the next middleware or controller
        next();
    } catch (error) {
        console.error('Token verification error:', error); // Log the error for debugging
        return res.status(400).json({ error: 'Invalid token.' });
    }
};
