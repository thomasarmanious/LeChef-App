const jwt = require('jsonwebtoken');
const User = require('../../../modules/UsersModule'); // Adjust the path to your User model

exports.getAdminProfile = async (req, res) => {
  try {
    const { token } = req.headers; // Extract token from headers

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verify the token
    const decodedToken = jwt.verify(token, 'your_secret_key'); // Replace with your actual secret key
    const adminId = decodedToken._id;

    // Fetch the admin details
    const admin = await User.findById(adminId);

  

    // Return admin profile details
    const adminProfile = {
      username: admin.username,
      _id: admin._id,
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      phone: admin.phone,
      password:admin.password,
      role: admin.role,
      createdAt: admin.created_at,
      updatedAt: admin.updated_at,
    };

    res.json({ message: 'Admin profile retrieved successfully', admin: adminProfile });
  } catch (error) {
    console.error('Error retrieving admin profile:', error);
    res.status(500).json({ message: 'Error retrieving admin profile', error: error.message });
  }
};


exports.getAdminDetails = async (req, res) => {
  try {
    const { token } = req.headers; // Extract token from headers

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verify the token
    const decodedToken = jwt.verify(token, 'your_secret_key'); // Replace with your actual secret key
    const userId = decodedToken._id;

    // Fetch the user details
    const user = await User.findById(userId);

  
    // Fetch admin details (assuming role = 'admin' identifies admins)
    const admins = await User.find({ role: 'admin' }).select('_id firstName lastName username image');

    if (!admins || admins.length === 0) {
      return res.status(404).json({ message: 'No admins found' });
    }

    // Return admin details
    res.json({ message: 'Admin details retrieved successfully', admins });
  } catch (error) {
    console.error('Error retrieving admin details:', error);
    res.status(500).json({ message: 'Error retrieving admin details', error: error.message });
  }
};