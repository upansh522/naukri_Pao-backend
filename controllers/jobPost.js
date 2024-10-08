const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const db = new Client({
  connectionString: process.env.DB_URL
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
    return;
  }
  console.log('Connected to the database');
});

async function handleJobPost(req, res) {
  const {
    jobid,
    recruiter_email,
    job_title,
    company,
    location,
    description,
    salary,
    skills,  
    job_type,
    min_qualification,
    min_experience
  } = req.body;

  console.log(req.body);

  try {
    const query = `
      INSERT INTO job_posts (
        job_id, recruiter_email, job_title, company, location, description, salary, job_type, min_qualification, min_experience
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id;
    `;

    const values = [
      jobid, recruiter_email, job_title, company, location, description, salary, job_type, min_qualification, min_experience
    ];

    // Start a transaction
    await db.query('BEGIN');

    const result = await db.query(query, values);
    const insertedJobId = result.rows[0].id;

    // Check if 'skills' is an array, and handle accordingly
    if (Array.isArray(skills) && skills.length > 0) {
      // Insert each skill into the database
      await Promise.all(skills.map(skill => handleSkillsRequired(skill, insertedJobId)));
    } else if (typeof skills === 'string' && skills.trim() !== '') {
      // If 'skills' is a single string, insert it directly
      await handleSkillsRequired(skills, insertedJobId);
    }

    // Commit the transaction
    await db.query('COMMIT');

    res.status(201).send("Job has been CREATED");
  } catch (err) {
    console.error('Error inserting job into database:', err);
    await db.query('ROLLBACK'); // Rollback the transaction on error
    if (!res.headersSent) {
      res.status(500).send('Error registering job');
    }
  }
}

// Adjusting the function to insert a skill and job id
async function handleSkillsRequired(skill, jobid) {
  try {
    const query = `
      INSERT INTO job_skills (skill, job_post_id) 
      VALUES ($1, $2)
    `;
    const values = [skill, jobid];

    await db.query(query, values);
  } catch (error) {
    console.error('Error inserting skills into database:', error.message);
    throw error; // Re-throw to handle upstream if necessary
  }
}

module.exports = { handleJobPost };
