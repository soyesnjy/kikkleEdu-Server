// router이므로 express.Router() 인스턴스 생성
const express = require("express");
const router = express.Router();
const { errController } = require("../controller/Legacy/Tips/index");
const { mypageController } = require("../controller/mypage");
const { loginController_KK } = require("../controller/login");

const {
  getKKTeacherAttendDataRead,
  postKKTeacherAttendDataUpdate,
  getKKAgencyReservationDataRead,
} = mypageController;

const { vaildateKKTokenCheck } = loginController_KK;

router.get("/teacher/read", vaildateKKTokenCheck, getKKTeacherAttendDataRead);
router.post(
  "/teacher/update",
  vaildateKKTokenCheck,
  postKKTeacherAttendDataUpdate
);

router.get(
  "/agency/read",
  vaildateKKTokenCheck,
  getKKAgencyReservationDataRead
);

// 에러 메세지 처리
router.use(errController.errMessageHandler);

// public 모듈화 - require(router/path)을 통해 인스턴스 생성 가능.
module.exports = router;
