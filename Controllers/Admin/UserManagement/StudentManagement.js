const User = require('../../../modules/UsersModule'); // Adjust the path as necessary
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cloudinary = require('../../../Util/Cloudinary');
const Notification = require('../../../modules/NotificationsModule'); 

// Function to add a new user (student)

exports.addStudent = async (req, res) => {
    try {
        const { username, email, password, phone, role, firstName, lastName, educationLevel } = req.body;

        // Check if username already exists
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Check if email already exists
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Hash the password before saving
        const salt = await bcrypt.genSalt(10); // Generate a salt
        const hashedPassword = await bcrypt.hash(password, salt); // Hash the password

        // Create a new student
        const student = new User({
            username,
            email,
            password: hashedPassword, // Save the hashed password
            phone,
            role: role || 'user', // Default to 'user' if no role is provided
            firstName,
            lastName,
            educationLevel,
        });

        // Generate JWT token
        const token = jwt.sign({ _id: student._id, role: student.role }, 'your_secret_key'); // Replace 'your_secret_key' with your actual secret key
        student.token = token;

        // Save student to the database
        await student.save();

        // Create a notification for the newly added student
        await Notification.create({
            message: `You Added New Student!\n${firstName} ${lastName} in Education Level: ${educationLevel}`,
            type: 'user',
            user: student._id, // Assuming the notification is for the admin or teacher
        });

        res.status(201).json({ 
            message: "Student registered successfully",
            user: {
                _id: student._id,
                username: student.username,
                email: student.email,
                phone: student.phone,
                role: student.role,
                firstName: student.firstName,
                lastName: student.lastName,
                educationLevel: student.educationLevel,
                token: student.token
            }
        });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};



exports.getAllStudents = async (req, res) => {
    try {
        const students = await User.find({ role: 'user' }); // Fetch all users with role 'user'
        res.status(200).json(students);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.updateStudent = async (req, res) => {
    try {
        const { username, email, password, phone , educationLevel} = req.body;

        const updatedStudent = await User.findByIdAndUpdate(
            req.params.id,
            {
                username,
                email,
                password,
                phone,
                educationLevel,
                updated_at: Date.now(),
            },
            { new: true } // Return the updated document
        );

        if (!updatedStudent) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.status(200).json(updatedStudent);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteStudent = async (req, res) => {
    try {
        const deletedStudent = await User.findByIdAndDelete(req.params.id);

        if (!deletedStudent) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.status(200).json({ message: 'Student deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};




exports.editProfile = async (req, res) => {
    try {
        const { userId } = req.params; // ID of the user to update
        const { token } = req.headers; // Extract token from headers

        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        // Verify the token
        const decodedToken = jwt.verify(token, 'your_secret_key');
        const adminId = decodedToken._id;



        // Fetch the user to update
        const userToUpdate = await User.findById(userId);
        if (!userToUpdate) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Extract the fields to update from the request body
        const {
            username,
            email,
            firstName,
            lastName,
            phone,
            address,
            educationLevel,
        } = req.body;

        // Handle profile image upload
        if (req.file) { // Assuming the image is sent as a file upload
            // Remove existing image from Cloudinary if it exists
            if (userToUpdate.image && userToUpdate.image.public_id) {
                await cloudinary.uploader.destroy(userToUpdate.image.public_id);
            }

            // Upload the new image
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'User Photos',
                resource_type: 'image',
            });

            // Update image details
            userToUpdate.image = {
                public_id: result.public_id,
                url: result.secure_url,
            };
        }

        // Update allowed fields
        if (username) userToUpdate.username = username;
        if (email) userToUpdate.email = email;
        if (firstName) userToUpdate.firstName = firstName;
        if (lastName) userToUpdate.lastName = lastName;
        if (phone) userToUpdate.phone = phone;
        if (address) userToUpdate.address = { ...userToUpdate.address, ...address };
        if (educationLevel) userToUpdate.educationLevel = educationLevel;

        // Save the updated user
        const updatedUser = await userToUpdate.save();

        res.json({ message: 'User profile updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
};


