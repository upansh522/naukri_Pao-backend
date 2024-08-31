const { Client } = require('pg');
const { validateToken } = require('../services/user');

const db = new Client({
  host: process.env.DB_CONNECTION_HOST,
  port: process.env.DB_CONNECTION_PORT,
  user: 'postgres',
  password: process.env.DB_CONNECTION_PASSWORD,
  database: 'Naukri_Pao',
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
    return;
  }
  console.log('Connected to the database');
});

async function jobRecommendation(req, res) {
  const userToken = req.cookies['User_token'];

  if (!userToken) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Verify and decode the token to get user ID
    const decodedToken = validateToken(userToken);
    const userId = decodedToken._id;

    // // Fetch user qualifications and skills
    const userQuery = 'SELECT highestDegree, experience, skills, currentStudies FROM user_professional_info WHERE userId = $1';
    const userResult = await db.query(userQuery, [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).send('User not found');
    }
    const user = userResult.rows[0];

    // const user_id=54;
    // const userQuery = 'SELECT highestDegree, experience, skills, currentStudies FROM user_professional_info WHERE userId = $1';
    // const userResult = await db.query(userQuery, [user_id]);
    // const user = userResult.rows[0];
    // console.log(user);

    const jobQuery = `
      SELECT j.id, j.job_title, j.company, j.location, j.description, j.salary, j.job_type, j.min_qualification, j.min_experience, js.skill
      FROM job_posts j
      LEFT JOIN job_skills js ON j.id = js.job_post_id
      WHERE
      (j.min_qualification = $1) AND (j.min_experience = $2);
    `;
    const jobResult = await db.query(jobQuery, [user.highestdegree,user.experience]);
    console.log(jobResult);


    // Organize jobs and skills
    const jobs = jobResult.rows.reduce((acc, row) => {
      const { id, job_title, company, location, description, salary, job_type, min_qualification, min_experience, skill } = row;
      if (!acc[id]) {
        acc[id] = { id, job_title, company, location, description, salary, job_type, min_qualification, min_experience, skills: [] };
      }
      if (skill) {
        acc[id].skills.push(skill);
      }
      return acc;
    }, {});

    const recommendedJobs = Object.values(jobs).filter(job => {
      const jobSkills = new Set(job.skills);
      const userSkills = new Set(user.skills);
      const matchingSkills = [...jobSkills].filter(skill => userSkills.has(skill)).length;
      return matchingSkills >= job.skills.length/2;
    });

    console.log(recommendedJobs);
    return res.status(200).json(recommendedJobs);
  } catch (err) {
    console.error('Error recommending jobs:', err);
    return res.status(500).send('Error recommending jobs');
  }
}

module.exports = { jobRecommendation };
