const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Private dashboard — shows the user their link + received messages
router.get('/dashboard', requireAuth, async (req, res) => {
  const result = await pool.query(
    'SELECT id, content, created_at FROM messages WHERE user_id = $1 ORDER BY created_at DESC',
    [req.user.id]
  );
  res.render('dashboard', {
    user: req.user,
    messages: result.rows,
    baseUrl: `${req.protocol}://${req.get('host')}`,
  });
});

// Delete a message
router.post('/messages/:id/delete', requireAuth, async (req, res) => {
  await pool.query('DELETE FROM messages WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  res.redirect('/dashboard');
});

// Public page — anyone with the link lands here to send an anonymous message
router.get('/u/:slug', async (req, res) => {
  const result = await pool.query('SELECT username, slug FROM users WHERE slug = $1', [req.params.slug]);
  const user = result.rows[0];
  if (!user) return res.status(404).render('404');
  res.render('send', { user, sent: false });
});

router.post('/u/:slug', async (req, res) => {
  const { content } = req.body;
  const result = await pool.query('SELECT id, username, slug FROM users WHERE slug = $1', [req.params.slug]);
  const user = result.rows[0];
  if (!user) return res.status(404).render('404');

  if (content && content.trim().length > 0 && content.length <= 1000) {
    await pool.query('INSERT INTO messages (user_id, content) VALUES ($1, $2)', [user.id, content.trim()]);
  }
  res.render('send', { user, sent: true });
});

module.exports = router;
