// router이므로 express.Router() 인스턴스 생성
const express = require("express");
const router = express.Router();
const { errController } = require("../controller/index");
const {
  signupController,
  signupController_Regercy,
} = require("../controller/signup");
const {
  postSignupDataCreate,
  getSignupDataRead,
  postSignupDataUpdate,
  deleteReviewDataDelete,
} = signupController;

// const { dupleCheckHandler, signupHandler } = signupController_Regercy;
// router.post("/", signupHandler);
// router.post("/duplecheck", dupleCheckHandler);

// KK 회원가입 컨트롤러
router.get("/read", getSignupDataRead); // Read
router.post("/create", postSignupDataCreate); // Create
router.post("/update", postSignupDataUpdate); // Update
router.delete("/delete", deleteReviewDataDelete); // Delete

// 에러 메세지 처리
router.use(errController.errMessageHandler);

// public 모듈화 - require(router/path)을 통해 인스턴스 생성 가능.
module.exports = router;
