const Video = require('../modules/VideosModule'); // Adjust the path to your Video model
const Quiz = require('../modules/QuizzesModule'); // Adjust the path to your Quiz model
const Pdf = require('../modules/PdfModule'); // Adjust the path to your Pdf model

// Middleware to check content access
exports.ContentAccess = (contentType) => {
    return async (req, res, next) => {
        console.log("Checking access for contentType:", contentType);

        if (!contentType) {
            return res.status(400).json({ message: "Invalid content type: Missing value" });
        }

        const normalizedContentType = contentType.toLowerCase();
        const user = req.user;
        const contentId = req.params.id;

        if (!user) {
            return res.status(401).json({ message: 'Unauthorized: No user found' });
        }

        let content;

        try {
            switch (normalizedContentType) {
                case 'video':
                    content = await Video.findById(contentId);
                    break;
                case 'quiz':
                    content = await Quiz.findById(contentId);
                    break;
                case 'pdf':
                    content = await Pdf.findById(contentId);
                    break;
                default:
                    return res.status(400).json({ message: `Invalid content type: ${contentType}` });
            }

            if (!content) {
                return res.status(404).json({ message: `Not Found: ${contentType} does not exist` });
            }

            const hasAccess = !content.paid || user.paidContent.some(
                (purchasedContent) =>
                    purchasedContent.contentId.toString() === contentId &&
                    purchasedContent.contentType.toLowerCase() === normalizedContentType
            );

            if (content.isLocked && content.paid && !hasAccess) {
                return res.status(403).json({ message: `This ${contentType} is locked. You should pay ${contentType} fees.` });
            }

            next();
        } catch (error) {
            console.error(`Error accessing ${contentType}:`, error);
            res.status(500).json({ message: `Internal server error while accessing ${contentType}` });
        }
    };
};

