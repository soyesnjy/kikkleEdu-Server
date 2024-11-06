// router이므로 express.Router() 인스턴스 생성
const express = require("express");
const router = express.Router();
const { errController } = require("../controller/index");
const {
  signupController,
  // signupController_Regercy,
} = require("../controller/signup");

const { loginController_KK } = require("../controller/login");

const {
  postSignupDataCreate,
  getSignupDataRead,
  postSignupDataUpdate,
  deleteReviewDataDelete,
} = signupController;

const { vaildateKKTokenCheck } = loginController_KK;

// KK 회원가입 컨트롤러
router.get("/read", vaildateKKTokenCheck, getSignupDataRead); // Read
router.post("/create", vaildateKKTokenCheck, postSignupDataCreate); // Create
router.post("/update", vaildateKKTokenCheck, postSignupDataUpdate); // Update
router.delete("/delete", vaildateKKTokenCheck, deleteReviewDataDelete); // Delete

// 에러 메세지 처리
router.use(errController.errMessageHandler);

// public 모듈화 - require(router/path)을 통해 인스턴스 생성 가능.
module.exports = router;
