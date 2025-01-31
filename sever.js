const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 8080;

app.use(cors()); 
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'mysql',
    database: 'chat',
    insecureAuth: true
});

connection.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});
app.get('/my-account', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'my-account.html'));
});
app.get('/travelling_link', (req, res) => {
    const service = req.query.service;

    if (service) {
        res.sendFile(path.join(__dirname, 'public', 'travellinglink.html'));
    } else {
        res.sendFile(path.join(__dirname, 'public', 'travellinglink.html'));
    }
});


app.get('/t9', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 't9.html'));
});


app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/username', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'username.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/signup', async (req, res) => {
    const userData = req.body;

    const checkMobileNumberQuery = 'SELECT * FROM users WHERE mobileNumber = ?';
    connection.query(checkMobileNumberQuery, [userData.mobileNumber], async (checkErr, checkResult) => {
        if (checkErr) {
            console.error('Error checking mobile number uniqueness:', checkErr);
            res.status(500).json({ error: 'Error checking mobile number uniqueness.', details: checkErr.message });
            return;
        }

        if (checkResult.length > 0) {
            res.status(400).json({ error: 'Mobile number already exists. You already have an account. Please log in.' });
        } else {

            const hashedPassword = await bcrypt.hash(userData.password, 10);
            userData.password = hashedPassword;

            const sql = 'INSERT INTO users SET ?';

            connection.query(sql, userData, (err, result) => {
                if (err) {
                    console.error('Error inserting user data into MySQL:', err);
                    res.status(500).json({ error: 'mobile number already taken try login.', details: err.message });
                    return;
                }

                console.log('User data stored successfully.');
                res.status(200).send('User data stored successfully.');
            });
        }
    });
});


app.post('/choose-username', (req, res) => {
    const username = req.body.username;

    const checkUsernameQuery = 'SELECT * FROM usernames WHERE username = ?';
    connection.query(checkUsernameQuery, [username], async (checkErr, checkResult) => {
        if (checkErr) {
            console.error('Error checking username uniqueness:', checkErr);
            res.status(500).json({ error: 'Error checking username uniqueness.', details: checkErr.message });
            return;
        }

        if (checkResult.length > 0) {
            res.status(400).json({ error: 'Username already exists. Please choose a different one.' });
        } else {
            const insertUsernameQuery = 'INSERT INTO usernames (username) VALUES (?)';
            connection.query(insertUsernameQuery, [username], (insertErr, insertResult) => {
                if (insertErr) {
                    console.error('Error inserting username into MySQL:', insertErr);
                    res.status(500).json({ error: 'Error storing username.', details: insertErr.message });
                    return;
                }

                console.log('Username selected now you can login.');
                res.status(200).json({ success: 'Username selected now you can login.' });
            });
        }
    });
});
app.post('/submit-form', (req, res) => {
    const formData = req.body;

    const sql = 'INSERT INTO trip_planning_survey SET ?';

    connection.query(sql, formData, (err, result) => {
        if (err) {
            console.error('Error inserting form data into MySQL:', err);
            res.status(500).json({ error: 'Error inserting form data into MySQL.', details: err.message });
            return;
        }

        console.log('Form data stored successfully.');
        res.status(200).send('Form data stored successfully.');
    });
});


app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const usernameQuery = 'SELECT * FROM usernames WHERE username = ?';
    connection.query(usernameQuery, [username], async (usernameErr, usernameResult) => {
        if (usernameErr) {
            console.error('Error checking username:', usernameErr);
            return res.status(500).json({ error: 'Error checking username.', details: usernameErr.message });
        }

        if (usernameResult.length === 0) {
            console.error("Username doesn't exist. Please try again.");
            return res.status(401).json({ error: "Username doesn't exist. Please try again." });
        }

        const userId = usernameResult[0].id; 
        const userQuery = 'SELECT * FROM users WHERE id = ?';
        connection.query(userQuery, [userId], async (userErr, userResult) => {
            if (userErr) {
                console.error('Error checking user data:', userErr);
                return res.status(500).json({ error: 'Error checking user data.', details: userErr.message });
            }

            try {
                const passwordMatches = await bcrypt.compare(password, userResult[0].password);

                if (passwordMatches) {
                    console.log('Login successful for username:', username);
                    return res.status(200).json({ success: 'You are now logged in!' });
                    return res.redirect('/userpage');  
                } else {
                    console.error('Incorrect password for username:', username);
                    return res.status(401).json({ error: "Username or password doesn't match! Please try again." });
                }
            } catch (error) {
                console.error('Error comparing passwords:', error);
                return res.status(500).json({ error: 'Error comparing passwords.', details: error.message });
            }
        });
    });
});


function query(sql, args) {
    return new Promise((resolve, reject) => {
        connection.query(sql, args, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
}


app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
});
