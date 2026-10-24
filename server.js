const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "100kb" }));

// Create a persistent SQLite database
const db = new Database(path.join(__dirname, "internships.db"));
db.pragma("foreign_keys = ON");

// Create internships table
db.exec(
  "CREATE TABLE IF NOT EXISTS internships (" +
    "id TEXT PRIMARY KEY, " +
    "title TEXT NOT NULL, " +
    "domain TEXT NOT NULL, " +
    "mode TEXT NOT NULL CHECK (mode IN ('Remote','Hybrid','On-site')), " +
    "location TEXT NOT NULL, " +
    "skills TEXT NOT NULL, " +
    "openings INTEGER NOT NULL CHECK (openings >= 0)" +
  ")"
);

// Create applications table
db.exec(
  "CREATE TABLE IF NOT EXISTS applications (" +
    "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
    "internship_id TEXT NOT NULL, " +
    "applicant_name TEXT NOT NULL, " +
    "applicant_email TEXT NOT NULL COLLATE NOCASE, " +
    "created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, " +
    "UNIQUE (internship_id, applicant_email), " +
    "FOREIGN KEY (internship_id) REFERENCES internships(id)" +
  ")"
);

// Sample internship records
const seedInternships = [
  {
    id: "INT-101",
    title: "Frontend Intern",
    domain: "Full Stack Development",
    mode: "Remote",
    location: "India",
    skills: ["HTML", "CSS", "JavaScript"],
    openings: 3
  },
  {
    id: "INT-102",
    title: "API Engineering Intern",
    domain: "Full Stack Development",
    mode: "Hybrid",
    location: "Pune",
    skills: ["Node.js", "SQL", "Testing"],
    openings: 2
  },
  {
    id: "INT-103",
    title: "UI/UX Intern",
    domain: "UI/UX",
    mode: "Remote",
    location: "India",
    skills: ["Figma", "Research", "Accessibility"],
    openings: 1
  },
  {
    id: "INT-104",
    title: "Data Analyst Intern",
    domain: "Data Analytics",
    mode: "On-site",
    location: "Bengaluru",
    skills: ["Excel", "SQL", "Data visualisation"],
    openings: 2
  },
  {
    id: "INT-105",
    title: "Security Operations Intern",
    domain: "Cyber Security",
    mode: "Remote",
    location: "India",
    skills: ["Linux", "Logs", "Networking"],
    openings: 1
  }
];

const insertInternship = db.prepare(
  "INSERT OR IGNORE INTO internships " +
  "(id, title, domain, mode, location, skills, openings) " +
  "VALUES (@id, @title, @domain, @mode, @location, @skills, @openings)"
);

const seedAll = db.transaction((records) => {
  for (const item of records) {
    insertInternship.run({
      ...item,
      skills: JSON.stringify(item.skills)
    });
  }
});

seedAll(seedInternships);

// Format database records for API responses
function formatInternship(row) {
  return {
    id: row.id,
    title: row.title,
    domain: row.domain,
    mode: row.mode,
    location: row.location,
    skills: JSON.parse(row.skills),
    openings: row.openings
  };
}

// Standard success response
function success(res, data, extra = {}) {
  return res.json({
    status: "success",
    data,
    ...extra
  });
}

// Standard error response
function fail(res, statusCode, message) {
  return res.status(statusCode).json({
    status: "error",
    data: null,
    error: { message }
  });
}

// Validate internship information
function validateInternship(body) {
  const errors = [];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return ["Request body must be a JSON object."];
  }

  for (const field of [
    "title",
    "domain",
    "mode",
    "location",
    "skills",
    "openings"
  ]) {
    if (body[field] === undefined) {
      errors.push(field + " is required.");
    }
  }

  for (const field of ["title", "domain", "location"]) {
    if (
      body[field] !== undefined &&
      (typeof body[field] !== "string" || body[field].trim() === "")
    ) {
      errors.push(field + " must be a non-empty string.");
    }
  }

  if (
    body.mode !== undefined &&
    !["Remote", "Hybrid", "On-site"].includes(body.mode)
  ) {
    errors.push("mode must be Remote, Hybrid, or On-site.");
  }

  if (
    body.skills !== undefined &&
    (!Array.isArray(body.skills) ||
      body.skills.some(
        (skill) => typeof skill !== "string" || skill.trim() === ""
      ))
  ) {
    errors.push("skills must be an array of non-empty strings.");
  }

  if (
    body.openings !== undefined &&
    (!Number.isInteger(body.openings) || body.openings < 0)
  ) {
    errors.push("openings must be a non-negative integer.");
  }

  return errors;
}

// Health-check endpoint
app.get("/api/health", (req, res) => {
  return success(res, {
    message: "Internship API is running."
  });
});
// GET all internships with pagination
// Example: /api/internships?page=1&limit=10
app.get("/api/internships", (req, res) => {
  const page = Number.parseInt(req.query.page || "1", 10);
  const limit = Number.parseInt(req.query.limit || "10", 10);

  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    return fail(
      res,
      400,
      "page must be at least 1 and limit must be between 1 and 100."
    );
  }

  const total = db
    .prepare("SELECT COUNT(*) AS count FROM internships")
    .get().count;

  const rows = db
    .prepare("SELECT * FROM internships ORDER BY id LIMIT ? OFFSET ?")
    .all(limit, (page - 1) * limit);

  return success(
    res,
    rows.map(formatInternship),
    {
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  );
});

// GET one internship by ID
app.get("/api/internships/:id", (req, res) => {
  const row = db
    .prepare("SELECT * FROM internships WHERE id = ?")
    .get(req.params.id);

  if (!row) {
    return fail(res, 404, "Internship not found.");
  }

  return success(res, formatInternship(row));
});

// CREATE an internship
app.post("/api/internships", (req, res) => {
  const errors = validateInternship(req.body);

  if (errors.length > 0) {
    return res.status(400).json({
      status: "error",
      data: null,
      error: {
        message: "Validation failed.",
        details: errors
      }
    });
  }

  const id =
    typeof req.body.id === "string" && req.body.id.trim()
      ? req.body.id.trim()
      : "INT-" + Date.now();

  try {
    db.prepare(
      "INSERT INTO internships " +
      "(id, title, domain, mode, location, skills, openings) " +
      "VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(
      id,
      req.body.title.trim(),
      req.body.domain.trim(),
      req.body.mode,
      req.body.location.trim(),
      JSON.stringify(req.body.skills),
      req.body.openings
    );

    const row = db
      .prepare("SELECT * FROM internships WHERE id = ?")
      .get(id);

    return res.status(201).json({
      status: "success",
      data: formatInternship(row)
    });
  } catch (err) {
    if (err && err.code === "SQLITE_CONSTRAINT_PRIMARYKEY") {
      return fail(res, 409, "An internship with this ID already exists.");
    }

    return fail(res, 500, "Could not create internship.");
  }
});

// UPDATE an existing internship
app.put("/api/internships/:id", (req, res) => {
  const current = db
    .prepare("SELECT * FROM internships WHERE id = ?")
    .get(req.params.id);

  if (!current) {
    return fail(res, 404, "Internship not found.");
  }

  const body = req.body || {};

  const updated = {
    title: body.title === undefined ? current.title : body.title,
    domain: body.domain === undefined ? current.domain : body.domain,
    mode: body.mode === undefined ? current.mode : body.mode,
    location: body.location === undefined ? current.location : body.location,
    skills:
      body.skills === undefined
        ? JSON.parse(current.skills)
        : body.skills,
    openings:
      body.openings === undefined
        ? current.openings
        : body.openings
  };

  const errors = validateInternship(updated);

  if (errors.length > 0) {
    return res.status(400).json({
      status: "error",
      data: null,
      error: {
        message: "Validation failed.",
        details: errors
      }
    });
  }

  db.prepare(
    "UPDATE internships SET title = ?, domain = ?, mode = ?, " +
    "location = ?, skills = ?, openings = ? WHERE id = ?"
  ).run(
    updated.title.trim(),
    updated.domain.trim(),
    updated.mode,
    updated.location.trim(),
    JSON.stringify(updated.skills),
    updated.openings,
    req.params.id
  );

  const row = db
    .prepare("SELECT * FROM internships WHERE id = ?")
    .get(req.params.id);

  return success(res, formatInternship(row));
});

// DELETE an internship
app.delete("/api/internships/:id", (req, res) => {
  const current = db
    .prepare("SELECT id FROM internships WHERE id = ?")
    .get(req.params.id);

  if (!current) {
    return fail(res, 404, "Internship not found.");
  }

  const applicationCount = db
    .prepare(
      "SELECT COUNT(*) AS count FROM applications WHERE internship_id = ?"
    )
    .get(req.params.id).count;

  if (applicationCount > 0) {
    return fail(
      res,
      409,
      "This internship has applications and cannot be deleted."
    );
  }

  db.prepare("DELETE FROM internships WHERE id = ?").run(req.params.id);

  return success(res, {
    message: "Internship deleted successfully."
  });
});

// SUBMIT an application
app.post("/api/applications", (req, res) => {
  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return fail(res, 400, "Request body must be a JSON object.");
  }

  const name =
    typeof body.applicant_name === "string"
      ? body.applicant_name.trim()
      : "";

  const email =
    typeof body.applicant_email === "string"
      ? body.applicant_email.trim().toLowerCase()
      : "";

  const internshipId =
    typeof body.internship_id === "string"
      ? body.internship_id.trim()
      : "";

  if (!name) {
    return fail(res, 400, "applicant_name is required.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fail(res, 400, "A valid applicant_email is required.");
  }

  if (!internshipId) {
    return fail(res, 400, "internship_id is required.");
  }

  const internship = db
    .prepare("SELECT id FROM internships WHERE id = ?")
    .get(internshipId);

  if (!internship) {
    return fail(res, 404, "Internship not found.");
  }

  try {
    const result = db
      .prepare(
        "INSERT INTO applications " +
        "(internship_id, applicant_name, applicant_email) " +
        "VALUES (?, ?, ?)"
      )
      .run(internshipId, name, email);

    return res.status(201).json({
      status: "success",
      data: {
        id: result.lastInsertRowid,
        internship_id: internshipId,
        applicant_name: name,
        applicant_email: email
      }
    });
  } catch (err) {
    if (err && err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return fail(
        res,
        409,
        "This email has already applied for this internship."
      );
    }

    return fail(res, 500, "Could not save application.");
  }
});

// Handle unknown routes
app.use((req, res) => {
  return fail(res, 404, "Route not found.");
});

// Handle invalid JSON and unexpected errors
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return fail(res, 400, "Request body contains invalid JSON.");
  }

  return fail(res, 500, "Internal server error.");
});

// Start the server
app.listen(PORT, () => {
  console.log("Internship API running at http://localhost:" + PORT);
});
