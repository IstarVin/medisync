-- Migration to add profileUrl column to users and students tables
-- Add profileUrl column to users table
ALTER TABLE users ADD COLUMN profile_url TEXT;

-- Rename profile_picture column to profile_url in students table (SQLite doesn't support RENAME COLUMN directly)
-- Create a new table with the updated schema
CREATE TABLE students_new (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    student_id TEXT NOT NULL UNIQUE,
    qr_code_id TEXT UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    middle_name TEXT,
    email TEXT UNIQUE,
    date_of_birth INTEGER NOT NULL,
    gender TEXT NOT NULL,
    grade TEXT NOT NULL,
    section TEXT,
    address TEXT,
    chronic_health_conditions TEXT NOT NULL DEFAULT '[]',
    current_medications TEXT NOT NULL DEFAULT '[]',
    doctor_id TEXT REFERENCES users(id),
    health_history TEXT,
    enrollment_date INTEGER NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    profile_url TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Copy data from old table to new table
INSERT INTO students_new (
    id, student_id, qr_code_id, first_name, last_name, middle_name, email,
    date_of_birth, gender, grade, section, address, chronic_health_conditions,
    current_medications, doctor_id, health_history, enrollment_date, is_active,
    profile_url, created_at, updated_at
)
SELECT 
    id, student_id, qr_code_id, first_name, last_name, middle_name, email,
    date_of_birth, gender, grade, section, address, chronic_health_conditions,
    current_medications, doctor_id, health_history, enrollment_date, is_active,
    profile_picture, created_at, updated_at
FROM students;

-- Drop the old table
DROP TABLE students;

-- Rename the new table
ALTER TABLE students_new RENAME TO students;