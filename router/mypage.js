// router이므로 express.Router() 인스턴스 생성
const express = require("express");
const router = express.Router();
const { errController } = require("../controller/index");
const { mypageController } = require("../controller/mypage");

const {
  getKKTeacherAttendDataRead,
  postKKTeacherAttendDataUpdate,
  getKKAgencyReservationDataRead,
} = mypageController;

router.get("/teacher/read", getKKTeacherAttendDataRead);
router.post("/teacher/update", postKKTeacherAttendDataUpdate);

router.get("/agency/read", getKKAgencyReservationDataRead);

// 에러 메세지 처리
router.use(errController.errMessageHandler);

// public 모듈화 - require(router/path)을 통해 인스턴스 생성 가능.
module.exports = router;
