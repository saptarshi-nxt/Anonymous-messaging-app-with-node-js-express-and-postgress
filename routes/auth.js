const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');
const pool = require('../db/pool');

const router = express.Router();

router.get('/signup', (req, res) => {
  res.render('signup', { error: null });
});

router.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password || password.length < 6) {
    return res.render('signup', { error: 'Username required, password must be 6+ characters.' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const slug = username.toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + nanoid(5);
    const result = await pool.query(
      'INSERT INTO users (username, password_hash, slug) VALUES ($1, $2, $3) RETURNING id, username, slug',
      [username, hash, slug]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, username: user.username, slug: user.slug }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.redirect('/dashboard');
  } catch (err) {
    if (err.code === '23505') {
      return res.render('signup', { error: 'Username already taken.' });
    }
    console.error(err);
    res.render('signup', { error: 'Something went wrong. Try again.' });
  }
});

router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];
    if (!user) return res.render('login', { error: 'Invalid username or password.' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.render('login', { error: 'Invalid username or password.' });

    const token = jwt.sign({ id: user.id, username: user.username, slug: user.slug }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.render('login', { error: 'Something went wrong. Try again.' });
  }
});

router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

module.exports = router;
