const express = require('express');
const userService = require('../services/user.service');

const router = express.Router();

router.get('/users', async (req, res, next) => {
  try {
    const { email, status, page, limit } = req.query;
    const opts = {};
    if (email) opts.email = email;
    if (status) opts.status = status;
    if (page) opts.page = Number(page);
    if (limit) opts.limit = Number(limit);
    const users = await userService.listUsers(opts);
    res.json(users);
  } catch (err) {
    next(err);
  }
});

router.post('/users', async (req, res, next) => {
  try {
    const created = await userService.createUserAdmin(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.get('/users/:user_id', async (req, res, next) => {
  try {
    const user = await userService.getUser(req.params.user_id);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.put('/users/:user_id', async (req, res, next) => {
  try {
    const updated = await userService.updateUser(req.params.user_id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/users/:user_id', async (req, res, next) => {
  try {
    const hard = req.query && req.query.hard === 'true';
    await userService.deleteUser(req.params.user_id, { hard });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
// Presentation layer: user management routes (CRUD, roles)

// TODO: implement route registrations
