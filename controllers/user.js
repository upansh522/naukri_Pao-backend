const bcrypt = require('bcrypt');
const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const db = new Client({
  host: 'localhost',
  port: process.env.DB_CONNECTION_PORT,
  user: 'postgres', 
  password: process.env.DB_CONNECTION_PASSWORD, 
  database: 'Naukri_Pao'
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
    return;
  }
  console.log('Connected to the database');
});

async function handleSignup(req, res) {
  const { firstName, lastName, emailAddress, dateOfBirth, mobileNo, fullAddress, postalCode, state, country, organization, sex, role, password, projects, currentStudies, highestDegree, resumeFilePath, experience, skills, project, lookingFor } = req.body;

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const query = `INSERT INTO user_info (firstName, lastName, emailAddress, dateOfBirth, mobileNo, fullAddress, postalCode, state, country, organization, sex, role, password, salt) 
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`;
                   
    const values = [firstName, lastName, emailAddress, dateOfBirth, mobileNo, fullAddress, postalCode, state, country, organization, sex, role, hashedPassword, salt];
    const result = await db.query(query, values);

    const userId = result.rows[0].id; // Get user ID

    // Handle Projects and Professional Info in parallel
    await Promise.all([
      handleProjectsAdd({ body: { projects, userId } }, res), // Pass userId to handleProjectsAdd
      handleProfessionalInfo({ body: { currentStudies, highestDegree, resumeFilePath, experience, skills, project, lookingFor } }, res)
    ]);

    // Ensure the response is only sent once
    if (!res.headersSent) {
      res.status(201).send('User registered successfully');
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
    if (!res.headersSent) {
      res.status(200).send('Projects inserted successfully');
    }
  } catch (error) {
    console.error('Error inserting projects into database:', error);
    await db.query('ROLLBACK');
    if (!res.headersSent) {
      res.status(500).send('Error inserting projects');
    }
  }
}
async function handleProfessionalInfo(req, res) {
  const { currentStudies, highestDegree, resumeFilePath, experience, skills, project, lookingFor } = req.body;

  try {
    const query = `INSERT INTO user_professional_info (currentStudies, highestDegree, resumeFilePath, experience, skills, project, lookingFor) 
                   VALUES ($1, $2, $3, $4, $5, $6, $7)`;

    const values = [currentStudies, highestDegree, resumeFilePath, experience, skills, project, lookingFor];

    const result = await db.query(query, values);
    console.log('Professional info added successfully:', result);
    // Ensure response only if handled separately
    if (!res.headersSent) {
      res.status(201).send('Professional info added successfully');
    }
  } catch (err) {
    console.error('Error inserting professional info into database:', err);
    if (!res.headersSent) {
      res.status(500).send('Error adding professional info');
    }
  }
}

// Handle user login
async function handleLogin(req, res) {
  const { email, password } = req.body;

  try {
    const query = `SELECT * FROM user_info WHERE emailAddress = $1`;
    const values = [email];

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      console.log('User not found');
      return res.status(404).send('User not found');
    }

    const user = result.rows[0];

    // Compare the provided password with the hashed password in the database
    const match = await bcrypt.compare(password, user.password);

    if (match) {
      console.log('Login successful');
      res.status(200).send('Login successful');
      // Proceed with session creation or token generation
    } else {
      console.log('Incorrect password');
      res.status(401).send('Incorrect password');
    }
  } catch (err) {
    console.error('Error fetching user from database:', err);
    res.status(500).send('Error logging in');
  }
}

module.exports = { handleSignup, handleLogin };
