const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: 'your-secret-key-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true in production with HTTPS
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Simple in-memory user storage (for demo purposes)
const users = [
  {
    id: 1,
    username: 'admin',
    password: bcrypt.hashSync('admin123', 10),
    role: 'admin'
  },
  {
    id: 2,
    username: 'user',
    password: bcrypt.hashSync('user123', 10),
    role: 'user'
  }
];

// Passport configuration
passport.use(new LocalStrategy((username, password, done) => {
  const user = users.find(u => u.username === username);
  
  if (!user) {
    return done(null, false, { message: 'Incorrect username.' });
  }
  
  if (!bcrypt.compareSync(password, user.password)) {
    return done(null, false, { message: 'Incorrect password.' });
  }
  
  return done(null, user);
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const user = users.find(u => u.id === id);
  done(null, user);
});

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
};

const isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.status(403).send('Access denied. Admin only.');
};

// Routes
app.get('/', (req, res) => {
  res.send(`
    <h1>Passport.js Authentication Demo</h1>
    <p>Welcome to the security testing application!</p>
    <p><a href="/login">Login</a> | <a href="/register">Register</a> | <a href="/dashboard">Dashboard</a></p>
    <p><strong>Test Accounts:</strong></p>
    <ul>
      <li>Admin: username=admin, password=admin123</li>
      <li>User: username=user, password=user123</li>
    </ul>
  `);
});

app.get('/login', (req, res) => {
  res.send(`
    <h1>Login</h1>
    <form method="POST" action="/login">
      <div>
        <label>Username:</label>
        <input type="text" name="username" required>
      </div>
      <div>
        <label>Password:</label>
        <input type="password" name="password" required>
      </div>
      <button type="submit">Login</button>
    </form>
    <p><a href="/">Back to Home</a></p>
  `);
});

app.post('/login', passport.authenticate('local', {
  successRedirect: '/dashboard',
  failureRedirect: '/login',
  failureFlash: true
}));

app.get('/register', (req, res) => {
  res.send(`
    <h1>Register</h1>
    <form method="POST" action="/register">
      <div>
        <label>Username:</label>
        <input type="text" name="username" required>
      </div>
      <div>
        <label>Password:</label>
        <input type="password" name="password" required>
      </div>
      <button type="submit">Register</button>
    </form>
    <p><a href="/">Back to Home</a></p>
  `);
});

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  
  if (users.find(u => u.username === username)) {
    return res.send('Username already exists!');
  }
  
  const newUser = {
    id: users.length + 1,
    username,
    password: bcrypt.hashSync(password, 10),
    role: 'user'
  };
  
  users.push(newUser);
  res.redirect('/login');
});

app.get('/dashboard', isAuthenticated, (req, res) => {
  res.send(`
    <h1>Dashboard</h1>
    <p>Welcome, ${req.user.username}!</p>
    <p>Role: ${req.user.role}</p>
    <p><a href="/admin">Admin Panel</a> | <a href="/logout">Logout</a></p>
    <p><a href="/">Back to Home</a></p>
  `);
});

app.get('/admin', isAdmin, (req, res) => {
  res.send(`
    <h1>Admin Panel</h1>
    <p>Welcome, Admin ${req.user.username}!</p>
    <p>This is a sensitive admin area.</p>
    <p><a href="/dashboard">Back to Dashboard</a> | <a href="/logout">Logout</a></p>
  `);
});

app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.send('Error logging out');
    }
    res.redirect('/');
  });
});

// API endpoints for testing
app.get('/api/users', isAuthenticated, (req, res) => {
  res.json(users.map(u => ({ id: u.id, username: u.username, role: u.role })));
});

app.get('/api/profile', isAuthenticated, (req, res) => {
  res.json({
    id: req.user.id,
    username: req.user.username,
    role: req.user.role
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Test accounts:');
  console.log('- Admin: admin / admin123');
  console.log('- User: user / user123');
});