const Router = require("express").Router;
const router = new Router();
const { body } = require("express-validator");
const userController = require("../controller/user-controller");
const authMiddleware = require("../middleware/auth-middleware");
const vacanciesMiddleware = require("../middleware/vacancies-middleware");

router.post(
  "/registration",
  body("email").isEmail(),
  body("password").isLength({ min: 6, max: 24 }),
  userController.registration,
);
router.post("/login", userController.login);
router.post("/logout", userController.logout);
router.get("/activate/:link", userController.activate);
router.get("/resend", userController.resend);
router.get("/refresh", userController.refresh);
router.post("/refresh/ack", userController.refreshAck);
router.get("/user", authMiddleware, userController.getUser);
router.get("/favorites", authMiddleware, userController.getFavorites);
router.post("/favorites", authMiddleware, userController.synchronizeFavorites);
router.put("/favorites", authMiddleware, userController.updateFavorites);
router.get("/vacanciesProxy", vacanciesMiddleware);
router.get("/places", userController.getPlaces);

module.exports = router;
