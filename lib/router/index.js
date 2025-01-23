const Router = require('express').Router;
const router = new Router();
const { body } = require('express-validator');
const userController = require('../controller/user-controller');
const authMiddleware = require('../middleware/auth-middleware');

router.post(
  '/registration',
  body('email').isEmail(),
  body('password').isLength({min: 3, max: 32}),
  userController.registration
);
router.post('/login', userController.login);
router.post('/logout', userController.logout);
router.get('/activate/:link', userController.activate);
router.get('/refresh', userController.refresh);
router.get(
  '/favorites',
  authMiddleware,
  userController.getFavorites
);
router.post(
  '/favorites',
  authMiddleware,
  userController.synchronizeFavorites
);
router.put(
  '/favorites',
  authMiddleware,
  userController.updateFavorites
);

module.exports = router;
