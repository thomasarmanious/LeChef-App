const userModule = require('../../../modules/UsersModule');
const Session = require('../../../modules/SessionsModule'); // Adjust the path as needed
const jwt = require('jsonwebtoken'); // Assuming you're using JWT for tokens
const mongoose = require('mongoose'); // Import mongoose for ObjectId conversion
const moment = require('moment-timezone'); 
const Notification = require('../../../modules/NotificationsModule'); 
const axios = require('axios');  // Required to send requests to Zoom API

exports.createZoomMeeting = async (req, res) => {
  const { title, description, level } = req.body; // Removed startTime and type from input

  try {
    // Extract teacher ID from the token payload (assumes req.user is populated by auth middleware)
    const teacherId = req.user._id;

    // 1. Get access token for Zoom API using OAuth credentials
    const tokenURL = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`;
    const credentials = Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString('base64');

    const tokenResponse = await axios.post(tokenURL, {}, {
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    });

    const accessToken = tokenResponse.data.access_token;

    // 2. Create the Zoom meeting by calling the Zoom API
    const meetingRequest = {
      title,
      type: 1, // Instant meeting type
      timezone: 'Africa/Cairo', // Informational, not used for calculations
      agenda: `Level ${level} Educational Session`,
    };

    const zoomResponse = await axios.post(
      'https://api.zoom.us/v2/users/me/meetings',
      meetingRequest,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const currentDateTime = moment().tz('Africa/Cairo'); // Use current time as start time

    // 3. Save session details to the database
    const newSession = new Session({
      title,
      description,
      level,
      date: currentDateTime.toDate(),
      hostUrl: zoomResponse.data.start_url,
      joinUrl: zoomResponse.data.join_url,
      zoomMeetingId: zoomResponse.data.id,
      teacher: teacherId,
    });

    await newSession.save();

    // 4. Create a notification for the newly created Zoom meeting
    await Notification.create({
      message: `New Zoom Meeting Created: Join at: ${zoomResponse.data.join_url}`,
      type: 'meeting',
      user: teacherId, // Assuming the notification is for the teacher
      level:level
    });

    // 5. Return the meeting details to the client
    res.status(201).json({
      message: 'Meeting created successfully',
      session: newSession,
    });
  } catch (error) {
    if (error.response) {
      console.error('Zoom API Error:', error.response.data);
      res.status(500).json({ error: error.response.data.message || 'Failed to create Zoom meeting' });
    } else {
      console.error('Unknown error:', error.message);
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
};



// Controller function to join a Zoom meeting
exports.joinZoomMeeting = async (req, res) => {
  const { meetingId } = req.body; // Extract meeting ID from the request body
  const userId = req.user._id;    // Assuming user ID is set by auth middleware

  try {
      // Fetch the user's education level from the database
      const user = await userModule.findById(userId).select('educationLevel');
      if (!user) {
          return res.status(404).json({ error: 'User not found' });
      }

      const studentLevel = user.educationLevel;

      // Get access token for Zoom API
      const tokenURL = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`;
      const credentials = Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString('base64');

      const tokenResponse = await axios.post(tokenURL, {}, {
          headers: {
              Authorization: `Basic ${credentials}`,
          },
      });

      const accessToken = tokenResponse.data.access_token;

      // Fetch the meeting details from Zoom API
      const meetingDetailsResponse = await axios.get(
          `https://api.zoom.us/v2/meetings/${meetingId}`,
          {
              headers: {
                  Authorization: `Bearer ${accessToken}`,
              },
          }
      );

      const meetingDetails = meetingDetailsResponse.data;

      // Extract and validate the meeting's level (e.g., from the agenda)
      const meetingLevel = parseInt(meetingDetails.agenda.split(' ')[1], 10); // Adjust based on your agenda format
      if (studentLevel === meetingLevel) {
          // Add user to the meeting's participants list in the database
          const session = await Session.findOneAndUpdate(
              { zoomMeetingId: meetingId }, // Match the session using Zoom meeting ID
              { $addToSet: { participants: userId } }, // Add user to participants if not already present
              { new: true } // Return the updated session document
          );

          if (!session) {
              return res.status(404).json({ error: 'Meeting not found' });
          }

          // Return the join URL for the student
          res.status(200).json({
              joinUrl: meetingDetails.join_url,
          });
      } else {
          res.status(403).json({ error: 'You are not eligible to join this meeting' });
      }
  } catch (error) {
      console.error('Error joining Zoom meeting:', error);
      res.status(500).json({ error: 'Failed to join Zoom meeting' });
  }
};
  
exports.getStudentZoomSessions = async (req, res) => {
  try {
    // Extract student ID from the token payload (assumes req.user is populated by auth middleware)
    const studentId = req.user._id;

    // Retrieve the student from the database to get their educational level
    const student = await userModule.findById(studentId);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const studentLevel = student.educationLevel;

    if (!studentLevel) {
      return res.status(400).json({ error: 'Student does not have an assigned educational level' });
    }

    // Log the student level for debugging
    console.log('Student Level:', studentLevel);

    // Get the current date and time in Cairo timezone
    const currentDateTime = moment().tz('Africa/Cairo');

    // Get access token for Zoom API
    const tokenURL = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`;
    const credentials = Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString('base64');

    const tokenResponse = await axios.post(tokenURL, {}, {
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    });

    const accessToken = tokenResponse.data.access_token;

    // Fetch a list of Zoom meetings (sessions)
    const zoomResponse = await axios.get('https://api.zoom.us/v2/users/me/meetings', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        type: 'live', // Get only live (active) meetings
      },
    });

    if (!zoomResponse.data.meetings || zoomResponse.data.meetings.length === 0) {
      return res.status(404).json({ message: 'No Zoom meetings found' });
    }

    // Log the Zoom API response for debugging
    console.log('Zoom API Response:', zoomResponse.data);

    // Filter Zoom meetings based on student level in the agenda
    const studentZoomSessions = zoomResponse.data.meetings.filter(meeting => {
      // Check if the agenda contains the student's level
      const meetingAgenda = meeting.agenda; // Using agenda to check the level
      console.log('Meeting Agenda:', meetingAgenda); // Log agenda for debugging

      return meetingAgenda && meetingAgenda.includes(`Level ${studentLevel}`);
    });

    if (studentZoomSessions.length === 0) {
      return res.status(404).json({ message: 'No active Zoom sessions found for this student level' });
    }

    res.status(200).json({
      message: 'Active Zoom sessions retrieved successfully for this student level',
      meetings: studentZoomSessions,
    });
  } catch (error) {
    // Log the error response to see the full details from Zoom API
    if (error.response) {
      console.error('Zoom API Error:', error.response.data);
      return res.status(500).json({ error: error.response.data.message || 'Failed to retrieve Zoom meetings' });
    } else {
      console.error('Error:', error.message);
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
};
