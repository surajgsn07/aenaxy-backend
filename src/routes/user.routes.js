import { Router } from "express";
import  {
    registerUser,
    setAvatar,
    setLocation,
    setPurpose,
    checkUsername,
    checkEmail,
    sendEmail,
    hello
} from '../controllers/user.controller.js'
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {uploadImage} from '../middlewares/multer.middleware.js'
const router = Router();

router.route("/hello").post(hello)
router.route("/register").post(registerUser);
router.route("/setAvatar").post(verifyJwt,uploadImage.single("avatar") , setAvatar);
router.route("/setLocation").post(verifyJwt , setLocation);
router.route("/setPurpose").post(verifyJwt,setPurpose);
router.route("/checkUsername").post(checkUsername);
router.route("/checkEmail").get(checkEmail);
router.route("/sendEmail").post(verifyJwt,sendEmail);

export default router;