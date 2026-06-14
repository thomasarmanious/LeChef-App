const mongoose = require('mongoose');
const cloudinary = require('../../../Util/Cloudinary');
const path = require('path'); // Import path module
const Video = require('../../../modules/VideosModule'); // Adjust the path to your Video model
const User = require('../../../modules/UsersModule'); // Adjust the path as necessary
const jwt = require('jsonwebtoken'); // Assuming you're using JWT for tokens
const Notification = require('../../../modules/NotificationsModule'); 


exports.UploadVideo = async (req, res) => {
    try {
        console.log("Uploaded files:", req.files); // Debugging logs

        const { title, description, amountToPay, paid, educationLevel } = req.body;
        const videoFile = req.files?.video?.[0];  // Access first file in array
        const thumbnailFile = req.files?.thumbnail?.[0];  

        if (!videoFile) {
            return res.status(400).json({ error: 'No video file uploaded' });
        }

        const token = req.headers.token;
        const decoded = jwt.verify(token, 'your_secret_key');  // Replace with your actual secret key
        const teacherId = decoded._id;  // Assuming '_id' contains the teacher's ID

        // Extract the original filename without extension
        const videoName = path.parse(videoFile.originalname).name;

        // Upload the video to Cloudinary
        const videoUploadResult = await cloudinary.uploader.upload(videoFile.path, {
            resource_type: 'video',
            folder: 'le chef/videos',
            public_id: videoName,
            upload_preset: 'ml_default',
        });

        let thumbnailUrl = null;
        if (thumbnailFile) {
            // Extract the thumbnail filename
            const thumbnailName = path.parse(thumbnailFile.originalname).name;

            // Upload the thumbnail to Cloudinary
            const thumbnailUploadResult = await cloudinary.uploader.upload(thumbnailFile.path, {
                resource_type: 'image',
                folder: 'le chef/Videos/Videos Thumbnail',
                public_id: thumbnailName,
                upload_preset: 'ml_default',
            });

            thumbnailUrl = thumbnailUploadResult.secure_url;
        }

        // Create the video object
        const newVideo = new Video({
            title,
            description,
            url: videoUploadResult.secure_url,  
            thumbnail: thumbnailUrl,  
            teacher: teacherId,
            amountToPay: paid ? amountToPay : undefined,
            paid: paid || true,
            isLocked: paid || true,
            educationLevel
        });

        await newVideo.save();

        // Create the notification
        await Notification.create({
            message: `New Video Uploaded! ${newVideo.title}!`,
            type: 'video',
            level: educationLevel
        });

        res.status(201).json(newVideo);
    } catch (error) {
        console.error("Upload error:", error); // Debugging
        res.status(400).json({ error: error.message });
    }
};



// Get all videos matching the user's educationLevel and return video-type paid content IDs
exports.getAllVideos = async (req, res) => {
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
            // If the user is an admin, return all videos
            const allVideos = await Video.find({});
            return res.status(200).json({
                videos: allVideos,
                message: 'All videos returned for admin.',
            });
        }

        // For non-admin users, filter videos based on education level
        const userEducationLevel = user.educationLevel;

        // Retrieve videos matching the user's education level
        const videos = await Video.find({ educationLevel: userEducationLevel });

        // Filter paid content to include only video-type IDs
        const videoPaidContentIds = user.paidContent
            .filter(content => content.contentType === 'Video')
            .map(content => content.contentId._id);

        // Structure the response with videos and video-type paid content IDs
        res.status(200).json({
            videos,
            videoPaidContentIds,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};





// Get a video by ID
exports.getVideoById = async (req, res) => {
    try {
        const { id } = req.params;
        const video = await Video.findById(id); // Find the video by ID

        if (!video) {
            return res.status(404).json({ error: 'Video not found' });
        }

        res.status(200).json(video);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update a video by ID
exports.updateVideo = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, teacher, url, amountToPay, paid, educationLevel } = req.body;

        // Log incoming data for debugging
        console.log('Update Request:', { id, title, description, teacher, url });

        // Update the video document
        const updatedVideo = await Video.findByIdAndUpdate(id, {
            title,
            description,
            teacher,
            url,
            amountToPay,
            paid,
            educationLevel
        }, { new: true, runValidators: true }); // Return the updated document and validate

        if (!updatedVideo) {
            return res.status(404).json({ error: 'Video not found' });
        }

        res.status(200).json(updatedVideo);
    } catch (error) {
        console.error('Update Error:', error.message); // Log the error message for debugging
        res.status(500).json({ error: error.message });
    }
};


// Delete a video by ID
exports.deleteVideo = async (req, res) => {
    try {
        const { id } = req.params;

        // Find and delete the video document
        const deletedVideo = await Video.findByIdAndDelete(id);

        if (!deletedVideo) {
            return res.status(404).json({ error: 'Video not found' });
        }

        res.status(200).json({ message: 'Video deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
