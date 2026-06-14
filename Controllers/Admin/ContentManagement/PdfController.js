const PDF = require('../../../modules/PdfModule'); // Adjust the path as needed
const mongoose = require('mongoose');
const cloudinary = require('../../../Util/Cloudinary');
const path = require('path'); // Import path module
const jwt = require('jsonwebtoken'); // Assuming you're using JWT for tokens
const User = require('../../../modules/UsersModule'); // Adjust the path as necessary

const Notification = require('../../../modules/NotificationsModule'); 

// Create a new PDF document
exports.createPDF = async (req, res) => {
    try {
        const { title, description, amountToPay, paid, educationLevel } = req.body; // Destructure new fields from request body
        const token = req.headers.token;
        const decoded = jwt.verify(token, 'your_secret_key'); // Replace with your actual secret key
        const teacherId = decoded._id; // Assuming '_id' contains the teacher's ID
        const file = req.file; // Get the uploaded file

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Extract the original filename without extension
        const originalName = path.parse(file.originalname).name;

        // Upload the PDF to Cloudinary with the original filename
        const uploadResult = await cloudinary.uploader.upload(file.path, {
            resource_type: 'raw',
            folder: 'le chef/pdfs',
            public_id: originalName, // Set the public_id to retain the original filename
        });

        // Create a new PDF document with the URL returned by Cloudinary
        const newPDF = new PDF({
            title,
            description,
            url: uploadResult.secure_url, // Use the Cloudinary URL for the PDF
            teacher: teacherId,
            amountToPay: paid ? amountToPay : undefined, // Only set amountToPay if the PDF is paid
            paid: paid || false, // Default to false if not specified
            isLocked: paid || true, // Lock the PDF if it's paid
            educationLevel // Add the education level
        });

        // Save the PDF document to the database
        const savedPDF = await newPDF.save();

        // Create the notification
        await Notification.create({
            message: `You have a new pdf: ${newPDF.title} - ${newPDF.description}!`,  // Include the pdf title in the message
            type: 'pdf',
            level:educationLevel
        })

        res.status(201).json(savedPDF);
        
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get a list of all PDFs
exports.getAllPDFs = async (req, res) => {
    try {
        const token = req.headers.token; // Extract the token from the headers
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: Token is missing' });
        }

        const decoded = jwt.verify(token, 'your_secret_key'); // Replace 'your_secret_key' with your actual secret key
        const userId = decoded._id; // Extract user ID from token

        // Find the user to check their role and details
        const user = await User.findById(userId).populate('paidContent.contentId');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if the user is an admin
        if (user.role === 'admin') {
            // If the user is an admin, return all PDFs
            const allPDFs = await PDF.find().populate('teacher', 'username email');
            return res.status(200).json({
                pdfs: allPDFs,
                message: 'All PDFs returned for admin.',
            });
        }

        // For non-admin users, filter PDFs based on education level
        const userEducationLevel = user.educationLevel;

        // Retrieve PDFs matching the user's education level
        const pdfs = await PDF.find({ educationLevel: userEducationLevel }).populate('teacher', 'username email');

        // Filter paid content to include only PDF-type IDs
        const pdfPaidContentIds = user.paidContent
            .filter(content => content.contentType === 'Pdf')
            .map(content => content.contentId._id);

        // Structure the response with PDFs and paid content IDs
        res.status(200).json({
            pdfs,
            pdfPaidContentIds,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get a single PDF by ID
exports.getPDFById = async (req, res) => {
    try {
        const pdf = await PDF.findById(req.params.id).populate('teacher', 'username email');
        if (!pdf) {
            return res.status(404).json({ message: 'PDF not found' });
        }
        res.status(200).json(pdf);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update a PDF by ID
exports.updatePDF = async (req, res) => {
    try {
        const { title, description, url } = req.body;
        const updatedPDF = await PDF.findByIdAndUpdate(req.params.id, {
            title,
            description,
            url,
        }, { new: true });

        if (!updatedPDF) {
            return res.status(404).json({ message: 'PDF not found' });
        }

        res.status(200).json(updatedPDF);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete a PDF by ID
exports.deletePDF = async (req, res) => {
    try {
        const deletedPDF = await PDF.findByIdAndDelete(req.params.id);
        if (!deletedPDF) {
            return res.status(404).json({ message: 'PDF not found' });
        }
        res.status(200).json({ message: 'PDF deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
