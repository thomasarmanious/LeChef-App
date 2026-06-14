require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

(async function run() {
  const image = 'Uploads\\image-1708198140857.jpg';
  const video = 'Uploads\\video-1708198140857.mp4';
  const pdf = 'Uploads\\document-1708198140857.pdf';

  try {
    // Uploading an image
    const imageResult = await cloudinary.uploader.upload(image);
    console.log(`Successfully uploaded ${image}`);
    console.log(`> Image URL: ${imageResult.secure_url}`);

    // Uploading a video
    const videoResult = await cloudinary.uploader.upload(video, {
      resource_type: 'video',
    });
    console.log(`Successfully uploaded ${video}`);
    console.log(`> Video URL: ${videoResult.secure_url}`);

    // Uploading a PDF (raw file)
    const pdfResult = await cloudinary.uploader.upload(pdf, {
      resource_type: 'raw',
    });
    console.log(`Successfully uploaded ${pdf}`);
    console.log(`> PDF URL: ${pdfResult.secure_url}`);
  } catch (error) {
    console.error('Error uploading files:', error);
  }
})();
