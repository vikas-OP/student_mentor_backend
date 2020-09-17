//importing files
const express = require("express");
const cors = require("cors");
const mongodb = require("mongodb");

//setting up
const app = express();
const mongoClient = mongodb.MongoClient;
const URL =
  "mongodb+srv://test_user:9r4dDd8Itvp0Nprb@cluster0.zzynb.mongodb.net?retryWrites=true&w=majority";
const PORT = process.env.PORT || 3000;

//middleware
app.use(express.json());
app.use(
  cors({
    origin: "https://vikas-student-mentor.netlify.app",
  })
);

//routes

//fetching students and mentors
app.get("/api/students", async (req, res) => {
  const client = await mongoClient.connect(URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  try {
    let db = client.db("student_mentor");
    let students = await db
      .collection("students")
      .find({}, { projection: { name: 1, mentor_id: 1, _id: 0 } })
      .toArray();
    client.close();
    if (students.length > 0) {
      res.json({
        noOfStudents: students.length,
        data: students,
      });
    } else {
      res.json({
        noOfStudents: 0,
      });
    }
  } catch {
    client.close();
    res.json({
      status: "failure",
      message: "something went wrong",
    });
  }
});

app.get("/api/mentors", async (req, res) => {
  const client = await mongoClient.connect(URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  try {
    const db = client.db("student_mentor");
    const mentors = await db
      .collection("mentors")
      .find({}, { projection: { name: 1, students: 1, _id: 0 } })
      .toArray();
    client.close();
    if (mentors.length == 0) {
      res.json({
        status: "success",
        noOfMentors: 0,
      });
    } else {
      res.json({
        status: "success",
        noOfMentors: mentors.length,
        data: mentors,
      });
    }
  } catch (error) {
    client.close();
    res.json({
      status: "failure",
      message: "something went wrong",
      error: error,
    });
  }
});

app.get("/api/students/nomentors", async (req, res) => {
  const client = await mongoClient.connect(URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  try {
    const db = client.db("student_mentor");
    const students = await db
      .collection("students")
      .find({ mentor_id: { $exists: false } })
      .toArray();
    client.close();
    let studentsData = [];
    students.forEach((student) => {
      studentsData.push(student.name);
    });
    res.json({
      status: "success",
      data: studentsData,
    });
  } catch (error) {
    client.close();
    res.json({
      status: "failure",
      message: "something went wrong",
    });
  }
});

app.get("/api/mentors/:name", async (req, res) => {
  const client = await mongoClient.connect(URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  try {
    const db = client.db("student_mentor");
    const mentor = await db
      .collection("mentors")
      .find({ name: req.params.name })
      .toArray();
    let studentData = [];
    for (let i = 0; i < mentor[0].students.length; i++) {
      let student = await db
        .collection("students")
        .find({ _id: mongodb.ObjectID(mentor[0].students[i]) })
        .toArray();
      studentData.push(student[0].name);
    }
    client.close();
    res.json({
      status: "success",
      data: studentData,
    });
  } catch (error) {
    client.close();
    res.json({
      status: "failure",
      message: "something went wrong",
    });
  }
});

//creating students and mentors
app.post("/api/mentors", async (req, res) => {
  const client = await mongoClient.connect(URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  try {
    const db = client.db("student_mentor");
    let mentor = await db
      .collection("mentors")
      .findOne({ name: req.body.name });
    if (mentor) {
      client.close();
      res.json({
        status: "failure",
        message: "mentor with this name already exists",
      });
    } else {
      let mentor = await db
        .collection("mentors")
        .insertOne({ name: req.body.name, students: [] });
      client.close();
      res.json({
        status: "success",
        data: mentor.ops[0].name,
      });
    }
  } catch (error) {
    client.close();
    res.json({
      status: "failure",
      message: "something went wrong",
    });
  }
});

app.post("/api/students", async (req, res) => {
  const client = await mongoClient.connect(URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  try {
    const db = client.db("student_mentor");
    let student = await db
      .collection("students")
      .findOne({ name: req.body.name });
    if (student) {
      client.close();
      res.json({
        status: "failure",
        message: "student with this name already exists",
      });
    } else {
      let student = await db
        .collection("students")
        .insertOne({ name: req.body.name });
      client.close();
      res.json({
        status: "success",
        data: student.ops[0].name,
      });
    }
  } catch (error) {
    client.close();
    res.json({
      status: "failure",
      message: "something went wrong",
    });
  }
});

//updating students and mentors
app.put("/api/students/:name", async (req, res) => {
  const client = await mongoClient.connect(URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  try {
    const db = client.db("student_mentor");
    let mentor = await db
      .collection("mentors")
      .find({ name: req.body.name })
      .toArray();
    await db.collection("students").findOneAndUpdate(
      { name: req.params.name },
      {
        $set: {
          mentor_id: mongodb.ObjectID(mentor[0]._id),
        },
      }
    );
    let students = mentor[0].students;
    let student = await db
      .collection("students")
      .find({ name: req.params.name })
      .toArray();
    students.push(student[0]._id);
    await db.collection("mentors").findOneAndUpdate(
      { name: mentor[0].name },
      {
        $set: {
          students: students,
        },
      }
    );
    client.close();
    res.json({
      status: "success",
      message: "mentor is assigned to student",
    });
  } catch (error) {
    client.close();
    res.json({
      status: "failure",
      message: "something went wrong",
    });
  }
});

app.put("/api/mentors/:name", async (req, res) => {
  const client = await mongoClient.connect(URL, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  });
  try {
    const db = client.db("student_mentor");
    const mentor = await db
      .collection("mentors")
      .find({ name: req.params.name })
      .toArray();
    let result = [];
    const students = req.body.students;
    for (let i = 0; i < students.length; i++) {
      const student = await db
        .collection("students")
        .find({ name: students[i] })
        .toArray();
      result.push(student[0]._id);
      await db
        .collection("students")
        .findOneAndUpdate(
          { name: students[i] },
          { $set: { mentor_id: mongodb.ObjectID(mentor[0]._id) } }
        );
    }
    await db
      .collection("mentors")
      .findOneAndUpdate(
        { name: req.params.name },
        { $set: { students: result } }
      );
    client.close();
    res.json({
      status: "success",
      message: "students assigned to mentors",
    });
  } catch (error) {
    client.close();
    res.json({
      status: "failure",
      message: "something went wrong",
    });
  }
});

app.listen(PORT, () => console.log("server running"));
