const express = require('express');
const router=express.Router();
const upload = require('../../uploads/uploads');
const { AddNote } = require('../../Controllers/Admin/ContentManagement/NotesController'); 
const { getAllNotes } = require('../../Controllers/Admin/ContentManagement/NotesController');
const { updateNote } = require('../../Controllers/Admin/ContentManagement/NotesController'); 
const { deleteNote } = require('../../Controllers/Admin/ContentManagement/NotesController'); 
const { getAllNotesForUserLevel } = require('../../Controllers/Admin/ContentManagement/NotesController');
const { userMiddleware } = require('../../Middleware/User');
const { authMiddleware } = require('../../Middleware/Auth');
const { ContentAccess } = require('../../Middleware/UserContentAccess');





const { createPDF } = require('../../Controllers/Admin/ContentManagement/PdfController'); 
const { getAllPDFs } = require('../../Controllers/Admin/ContentManagement/PdfController'); 
const { deletePDF } = require('../../Controllers/Admin/ContentManagement/PdfController'); 
const { adminMiddleware } = require('../../Middleware/Admin');



const { UploadVideo, getAllVideos, getVideoById, updateVideo, deleteVideo } = require('../../Controllers/Admin/ContentManagement/VideoController'); 



router.route('/Notes').post(adminMiddleware,AddNote);
router.route('/ShowAllNotes').get(authMiddleware,getAllNotes);
router.route('/UpdateNotes/:id').put(adminMiddleware,updateNote);
router.route('/DeleteNotes/:id').delete(adminMiddleware,deleteNote);
router.route('/ShowLevelNotes').get(userMiddleware,getAllNotesForUserLevel);



router.route('/Pdfs').post(upload.single('pdf'),adminMiddleware,createPDF);
router.route('/ShowAllPdfs').get(authMiddleware,getAllPDFs);
router.route('/DeletePdf/:id').delete(adminMiddleware,deletePDF);

// Define routes
router.route('/videos')
  .get(authMiddleware, getAllVideos)
  .post(upload.fields([
      { name: 'video', maxCount: 1 },
      { name: 'thumbnail', maxCount: 1 }
  ]), adminMiddleware, UploadVideo);


 router.route('/videos/:id')
 .get(userMiddleware,ContentAccess('Video'), getVideoById) // Get a video by ID with access control
 .put(adminMiddleware, updateVideo) // Update a video by ID
 .delete(adminMiddleware, deleteVideo); // Delete a video by 

module.exports=router;
