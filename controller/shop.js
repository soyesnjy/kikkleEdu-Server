// MySQL 접근
const mysql = require("mysql");
const { dbconfig_kk } = require("../DB/database");

// 키클 DB 연결
const connection_KK = mysql.createConnection(dbconfig_kk);
connection_KK.connect();

// 포트원 관련
const PortOne = require("@portone/server-sdk");
const portone = PortOne.PortOneClient({ secret: process.env.V2_API_SECRET });

const paymentStore = new Map();

// 포트원측 결제ID와 요청된 결제ID의 일치여부 판단
async function syncPayment(paymentId) {
  if (!paymentStore.has(paymentId)) {
    paymentStore.set(paymentId, {
      status: "PENDING",
    });
  }
  const payment = paymentStore.get(paymentId);
  let actualPayment;
  try {
    actualPayment = await portone.payment.getPayment({ paymentId });
  } catch (err) {
    delete err.headers;
    console.error(err);
    return false;
  }
  if (actualPayment.status === "PAID") {
    // 인증 아이템 확인
    // if (!verifyPayment(actualPayment)) return false;
    if (payment.status === "PAID") return payment;
    payment.status = "PAID";
    // console.info("결제 성공");
  } else {
    return false;
  }
  return payment;
}

const ShopController = {
  // PortOne Payment Compleate
  postPortOnePaymentCompleate: async (req, res, next) => {
    // console.log("PortOne Payment Compleate API 호출");
    let parseData;
    try {
      const { data } = req.body;
      // 파싱. Client JSON 데이터
      if (typeof data === "string") {
        parseData = JSON.parse(data);
      } else parseData = data;

      const { paymentId } = parseData;

      if (typeof paymentId !== "string")
        return res.status(400).send("올바르지 않은 요청입니다.").end();

      const payment = await syncPayment(paymentId);
      if (!payment) return res.status(400).send("결제 동기화에 실패했습니다.");

      // TODO: DB 수정 테이블 추가

      return res.status(200).json({
        status: payment.status,
      });
    } catch (err) {
      delete err.headers;
      console.error(err);
      return res.status(500).json({
        message: `Server Error : ${err.message}`,
      });
    }
  },
};

module.exports = {
  ShopController,
};
