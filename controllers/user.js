const bcrypt = require('bcrypt');
const { Client } = require('pg');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const { createToken } = require('../services/user');

dotenv.config();

const db = new Client({
  connectionString: `postgres://${process.env.DB_USERNAME}:${process.env.DB_CONNECTION_PASSWORD}@${process.env.DB_CONNECTION_HOSTNAME}:${process.env.DB_CONNECTION_PORT}/${process.env.DB_NAME}?ssl=true`
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
    return;
  }
  console.log('Connected to the database');
});

async function handleSignup(req, res) {
  const { firstName, lastName, emailAddress, dateOfBirth, mobileno, fullAddress, postalCode, state, country, organization, sex, role, password, projects, currentStudies, highestDegree, experience, skills, project, lookingFor } = req.body;
  const resumeFilePath = req.file ? req.file.path : null;

  console.log(req.body);  // Check other form fields
  console.log(req.file);


  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const query = `INSERT INTO user_info (firstName, lastName, emailAddress, dateOfbirth, mobileno, fullAddress, postalCode, state, country, organization, sex, role, password, salt) 
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`;

    const values = [firstName, lastName, emailAddress, dateOfBirth, mobileno, fullAddress, postalCode, state, country, organization, sex, role, hashedPassword, salt];
    const result = await db.query(query, values);

    const user = result.rows[0];
    const userId = user.id;

    await Promise.all([
      handleProjectsAdd({ body: { projects, userId } }, res),
      handleProfessionalInfo({ body: { userId, currentStudies, highestDegree, resumeFilePath, experience, skills, project, lookingFor } }, res)
    ]);

    const token = createToken(user);
    res.cookie("User_token", token, { httpOnly: true, sameSite: 'none', secure: true });

    if (!res.headersSent) {
      return res.status(201).send('Registration successful');
    }
  } catch (err) {
    console.error('Error inserting user into database:', err);
    if (!res.headersSent) {
      res.status(500).send('Error registering user');
    }
  }
}

async function handleProjectsAdd(req, res) {
  const { projects, userId } = req.body;

  try {
    if (!userId) {
      return res.status(400).send('User ID is required');
    }

    await db.query('BEGIN');

    for (const element of projects) {
      const query = `
        INSERT INTO projects (projectname, projectdescription, userid) 
        VALUES ($1, $2, $3)
      `;
      const values = [element.name, element.description, userId];

      await db.query(query, values);
    }

    await db.query('COMMIT');
  } catch (error) {
    console.error('Error inserting projects into database:', error);
    await db.query('ROLLBACK');
    if (!res.headersSent) {
      res.status(500).send('Error inserting projects');
    }
  }
}

async function handleProfessionalInfo(req, res) {
  const { userId, currentStudies, highestDegree, resumeFilePath, experience, skills, project, lookingFor } = req.body;

  try {
    const query = `INSERT INTO user_professional_info (userid, currentStudies, highestDegree, resumeFilePath, experience, skills, project, lookingFor) 
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`;

    const values = [userId, currentStudies, highestDegree, resumeFilePath, experience, skills, project, lookingFor];

    const result = await db.query(query, values);
    console.log('Professional info added successfully:', result);
  } catch (err) {
    console.error('Error inserting professional info into database:', err);
    if (!res.headersSent) {
      res.status(500).send('Error adding professional info');
    }
  }
}

async function handleLogin(req, res) {
  const { emailAddress, password } = req.body;

  try {
    const query = `SELECT * FROM user_info WHERE emailAddress = $1`;
    const values = [emailAddress];

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      console.log('User not found');
      return res.status(404).send('User not found');
    }

    const user = result.rows[0];

    const match = await bcrypt.compare(password, user.password);

    if (match) {
      const token = createToken(user);
      console.log(token);
      res.cookie('User_token', token,{ httpOnly: true, sameSite: 'none', secure: true}).send('cookie set');
      
    } else {
      console.log('Incorrect password');
      res.status(401).send('Incorrect password');
    }
  } catch (err) {
    console.error('Error fetching user from database:', err);
    res.status(500).send('Error logging in');
  }
}

async function handleSignout(req,res){
  res.clearCookie('User_token', {
    path: '/',
    domain: 'https://naukri-pao-frontend-4hwh.vercel.app/, // Replace with your domain if applicable',
    secure: true,
    httpOnly: true,
    sameSite: 'None'  // Use 'None' for cross-site cookies with Secure
  });
res.status(200).send('Logged out');
}
// Export routes
module.exports = { handleSignup, handleLogin,handleSignout};
