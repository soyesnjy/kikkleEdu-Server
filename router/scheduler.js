const express = require("express");
const router = express.Router();

const { errController } = require("../controller/Legacy/Tips/index");
const { SchedulerController } = require("../controller/scheduler");

const {
  getKKSchedulerDataRead,
  postKKSchedulerDataCreate,
  postKKSchedulerDataRecursiveCreate,
  postKKSchedulerDataDragUpdate,
  postKKSchedulerDataClickUpdate,
  deleteKKSchedulerDataDelete,
  deleteKKSchedulerDataGroupDelete,
} = SchedulerController;

router.get("/read", getKKSchedulerDataRead);

router.post("/create", postKKSchedulerDataCreate);
router.post("/create/group", postKKSchedulerDataRecursiveCreate); // Group Create Routing

router.patch("/update/drag", postKKSchedulerDataDragUpdate); // Drag Update Routing
router.patch("/update/click", postKKSchedulerDataClickUpdate); // Click Update Routing

router.delete("/delete", deleteKKSchedulerDataDelete);
router.delete("/delete/group", deleteKKSchedulerDataGroupDelete); // Group Delete Routing

// 에러 메세지 처리
router.use(errController.errMessageHandler);

// public 모듈화 - require(router/path)을 통해 인스턴스 생성 가능.
module.exports = router;
