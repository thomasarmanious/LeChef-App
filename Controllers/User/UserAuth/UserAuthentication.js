const User = require('../../../modules/UsersModule');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid'); // Generates a unique device token

exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body; 

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'Wrong Email OR Password!' });
        }

        // Compare the entered password with the hashed password in the database
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Wrong Email OR Password!' });
        }

         // Allow admins to log in multiple times without device token restriction
         if (user.role !== 'admin' && user.deviceToken) {
            return res.status(403).json({ message: 'You are already logged in on another device!' });
        }

        // Generate a new unique deviceToken only for non-admin users
        if (user.role !== 'admin') {
            user.deviceToken = uuidv4();
            await user.save();
        }

        res.status(200).json({
            message: 'Logged in successfully!',
            devicetoken:user.deviceToken,
            role: user.role,
            _id: user._id,
            username: user.username,
            email: user.email,
            educationLevel: user.educationLevel,
            image: user.image,
            phone: user.phone,
            token:user.token
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
