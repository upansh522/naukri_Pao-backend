-- Create the database Nauri_Pao
CREATE DATABASE IF NOT EXISTS Nauri_Pao;

-- Use the Nauri_Pao database
USE Nauri_Pao;

-- Create the user_info table
CREATE TABLE IF NOT EXISTS user_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    firstName VARCHAR(255) NOT NULL,
    lastName VARCHAR(255) NOT NULL,
    emailAddress VARCHAR(255) UNIQUE NOT NULL,
    dateOfBirth DATE NOT NULL,
    mobileNo VARCHAR(15) NOT NULL,
    fullAddress TEXT NOT NULL,
    postalCode VARCHAR(10) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    organization VARCHAR(255),
    sex ENUM('Male', 'Female', 'Other') NOT NULL,
    role VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    salt VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  
);

-- Create the user_professional_info table
CREATE TABLE IF NOT EXISTS user_professional_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    currentStudies VARCHAR(255),
    highestDegree VARCHAR(255),
    resumeFilePath VARCHAR(255),
    experience TEXT,
    skills JSON, -- JSON format for storing arrays
    project INT, -- Foreign key to projects table
    lookingFor VARCHAR(255),
    FOREIGN KEY (userId) REFERENCES user_info(id),
    FOREIGN KEY (project) REFERENCES projects(id)
);

-- Create the projects table
CREATE TABLE IF NOT EXISTS projects (
    projectId INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    projectName VARCHAR(255) NOT NULL,
    projectDescription TEXT
);
