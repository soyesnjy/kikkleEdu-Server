// router이므로 express.Router() 인스턴스 생성
const express = require("express");
const router = express.Router();
const { errController } = require("../controller/Legacy/Tips/index");
const { ReservationController } = require("../controller/reservation");

const {
  getKKReservationDataRead,
  postKKReservationDataCreate,
  postKKReservationDataUpdate,
  deleteKKReservationDataDelete,
} = ReservationController;

router.get("/read", getKKReservationDataRead);
router.post("/create", postKKReservationDataCreate);
router.post("/update", postKKReservationDataUpdate);
router.delete("/:id", deleteKKReservationDataDelete);

// 에러 메세지 처리
router.use(errController.errMessageHandler);

// public 모듈화 - require(router/path)을 통해 인스턴스 생성 가능.
module.exports = router;
