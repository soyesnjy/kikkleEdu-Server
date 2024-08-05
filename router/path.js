// router이므로 express.Router() 인스턴스 생성
const express = require("express");
const router = express.Router();

const { pathController } = require("../controller/index");

router.get("/", pathController.default);
router.get("/first", pathController.first);
router.get("/second", pathController.second);

// parameter는 :뒤에오는 변수 명이 key, 요청 시 입력된 값을 value로 하는 객체 저장
router.get("/params/:id", pathController.params);

// query는 요청 시 ?뒤에 a=b 형태의 입력을 받는데 a=>key, b=>value로 하는 객체 저장.
router.get("/query", pathController.query);

// post는 요청 시 body값을 함께 서버로 보낸다.
router.post("/", pathController.post);

// 동물 이름에 맞는 울음소리를 반환.
router.get("/sound/:name", pathController.sound);

// public 모듈화 - require(router/path)을 통해 인스턴스 생성 가능.
module.exports = router;
