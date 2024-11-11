// router이므로 express.Router() 인스턴스 생성
const express = require("express");
const router = express.Router();
const { errController } = require("../controller/Legacy/Tips/index");
const { teacherController } = require("../controller/teacher");
const { loginController_KK } = require("../controller/login");

const { getKKTeacherDataRead } = teacherController;
const { vaildateKKTokenCheck } = loginController_KK;

router.get(
  "/",
  // vaildateKKTokenCheck,
  getKKTeacherDataRead
);

// 에러 메세지 처리
router.use(errController.errMessageHandler);

// public 모듈화 - require(router/path)을 통해 인스턴스 생성 가능.
module.exports = router;
