// stream 데이터 처리
const stream = require("stream");

// MySQL 접근
const mysql = require("mysql");
const { dbconfig, dbconfig_ai, dbconfig_kk } = require("../DB/database");

// AI DB 연결
const connection_AI = mysql.createConnection(dbconfig_ai);
connection_AI.connect();
// 키클 DB 연결
const connection_KK = mysql.createConnection(dbconfig_kk);
connection_KK.connect();

// 구글 권한 관련
const { google } = require("googleapis");

// GCP IAM 서비스 계정 인증
const serviceAccount = {
  private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  project_id: process.env.GOOGLE_PROJECT_ID,
};

const auth_google_drive = new google.auth.JWT({
  email: serviceAccount.client_email,
  key: serviceAccount.private_key,
  scopes: ["https://www.googleapis.com/auth/drive"],
});

const drive = google.drive({ version: "v3", auth: auth_google_drive });

// Database Table Info
const {
  User_Table_Info,
  KK_User_Table_Info,
} = require("../DB/database_table_info");

// 동기식 DB 접근 함수 1. Promise 생성 함수
function queryAsync(connection, query, parameters) {
  return new Promise((resolve, reject) => {
    connection.query(query, parameters, (error, results, fields) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}
// 프로미스 resolve 반환값 사용. (User Data return)
async function fetchUserData(connection, query) {
  try {
    let results = await queryAsync(connection, query, []);
    // console.log(results[0]);
    return results;
  } catch (error) {
    console.error(error);
  }
}

const user_kk_select = async (user_table, user_attribute, parsepUid) => {
  const select_query = `SELECT * FROM ${user_table} WHERE ${user_attribute.attr1}='${parsepUid}'`;
  const select_data = await fetchUserData(connection_KK, select_query);

  return select_data;
};

const signupController = {
  // AI 중복 체크
  dupleCheckAIHandler: (req, res) => {
    const { id, vrNum, type } = req.body;

    // MySQL DB 연동
    if (type === "id") {
      connection.query(
        `SELECT * FROM teacher WHERE (teacher_uid = '${id}')`,
        (error, rows, fields) => {
          if (error) console.log(error);
          if (rows.length) {
            res.json({ data: "Fail" });
          } else res.json({ data: "Success" });
        }
      );
    } else {
      connection.query(
        `SELECT * FROM teacher WHERE (vr_number = '${vrNum}')`,
        (error, rows, fields) => {
          if (error) console.log(error);
          if (rows.length) {
            res.json({ data: "Fail" });
          } else res.json({ data: "Success" });
        }
      );
    }
  },
  // KK 회원가입
  postSignupAIHandler: async (req, res) => {
    const { SignUpData } = req.body;
    // console.log(SignUpData);

    let parseSignUpData, parsepUid;
    const regex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/; // 한글 및 한글 자모를 포함하는 정규 표현식
    try {
      // 입력값 파싱
      if (typeof SignUpData === "string") {
        parseSignUpData = JSON.parse(SignUpData);
      } else parseSignUpData = SignUpData;

      const {
        // 강사 회원가입 데이터
        pUid,
        type,
        passWord,
        name,
        phoneNumber,
        possLocal,
        possDay,
        possClass,
        career,
        education,
        file,
      } = parseSignUpData;

      // Input 없을 경우
      if (!pUid || !passWord) {
        return res
          .status(400)
          .json({ message: "Non Sign Up Input Value - 400 Bad Request" });
      }

      const [baseType, zipBase64] = file.split(",");
      const bufferStream = new stream.PassThrough();
      bufferStream.end(Buffer.from(zipBase64, "base64"));

      parsepUid = pUid;
      // 입력값이 한글일 경우
      // if (regex.test(pUid) || regex.test(passWard)) {
      //   return res
      //     .status(400)
      //     .json({ message: "Non Korean Input Value - 400 Bad Request" });
      // }

      const user_table = KK_User_Table_Info[type].table;
      const user_attribute = KK_User_Table_Info[type].attribute;

      // 오늘 날짜 변환
      const dateObj = new Date();
      const year = dateObj.getFullYear();
      const month = ("0" + (dateObj.getMonth() + 1)).slice(-2);
      const day = ("0" + dateObj.getDate()).slice(-2);
      const date = `${year}-${month}-${day}`;

      // 1. SELECT TEST (row가 있는지 없는지 검사)
      // User 계정 DB SELECT Method. uid를 입력값으로 받음
      // const user_data = await user_ai_select(user_table, user_attribute, pUid);

      const user_data = await user_kk_select(
        user_table,
        user_attribute,
        parsepUid
      );
      // return res.status(400).json({ message: "User SignUp Success! - 200 OK" });

      // 2. DUPLICATE USER (row 중복검사)
      if (user_data[0]) {
        // 같은 uid의 User가 이미 존재하는 경우
        return res
          .status(403)
          .json({ message: "Duplicate User - 403 Forbidden" });
      }
      // 3. INSERT USER (row가 없는 경우). 중복 검사 통과
      else {
        delete user_attribute.pKey;
        delete user_attribute.attr13;
        delete user_attribute.attr14;

        const insert_query = `INSERT INTO ${user_table} (${Object.values(
          user_attribute
        ).join(", ")}) VALUES (${Object.values(user_attribute)
          .map((el) => "?")
          .join(", ")})`;
        // console.log(insert_query);

        // INSERT Value 명시
        const insert_value_obj = {
          attr1: pUid,
          attr2: passWord,
          attr3: "",
          attr4: name,
          attr5: phoneNumber,
          attr6: "",
          attr7: possLocal,
          attr8: possDay.sort((a, b) => a - b).join("/"),
          attr9: career,
          attr10: education,
          attr11: "",
          attr12: 0,
        };
        // console.log(insert_value);

        // 계정 생성 (비동기 처리)
        connection_KK.query(
          insert_query,
          Object.values(insert_value_obj),
          (error, rows, fields) => {
            if (error) {
              console.log(error);
              res.status(400).json({ message: error.sqlMessage });
            } else {
              // console.log(rows);
              const teacher_id = rows.insertId; // 삽입한 강사의 pKey
              const table = KK_User_Table_Info["teacher_class"].table;
              const attribute = KK_User_Table_Info["teacher_class"].attribute;
              const insert_query = `INSERT INTO ${table} (${attribute.attr1}, ${
                attribute.attr2
              }) VALUES ${possClass
                .map((el) => {
                  return `(${teacher_id}, ${el})`;
                })
                .join(", ")}`;

              connection_KK.query(insert_query, null, (err) => {
                if (error) {
                  console.log(error);
                  res.status(400).json({ message: error.sqlMessage });
                } else {
                  console.log("Guest User Row DB INSERT Success!");
                  res
                    .status(200)
                    .json({ message: "User SignUp Success! - 200 OK" });
                }
              });
            }
          }
        );
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server Error - 500 Bad Gateway" });
    }
  },
  // TODO# (관리자) 회원가입 Update - 승인,프로필 이미지, 소개말 등등...
};

const signupController_Regercy = {
  // VR 중복 체크
  dupleCheckHandler: (req, res) => {
    const { id, vrNum, type } = req.body;

    // MySQL DB 연동
    if (type === "id") {
      connection.query(
        `SELECT * FROM teacher WHERE (teacher_uid = '${id}')`,
        (error, rows, fields) => {
          if (error) console.log(error);
          if (rows.length) {
            res.json({ data: "Fail" });
          } else res.json({ data: "Success" });
        }
      );
    } else {
      connection.query(
        `SELECT * FROM teacher WHERE (vr_number = '${vrNum}')`,
        (error, rows, fields) => {
          if (error) console.log(error);
          if (rows.length) {
            res.json({ data: "Fail" });
          } else res.json({ data: "Success" });
        }
      );
    }
  },
  // VR 회원가입
  signupHandler: (req, res) => {
    const { id, pwd, name, age, email, vrNum } = req.body;
    // 서버측 2중 보안
    if (!id || !pwd || !vrNum) res.json({ data: "Fail" });
    // MySQL DB 연동
    connection.query(
      `INSERT INTO teacher VALUES ('${vrNum}', '${id}', '${pwd}')`,
      (error) => {
        if (error) {
          console.log(error);
          res.json({ data: "Fail" });
        } else res.json({ data: "Success" });
      }
    );
  },
};

module.exports = {
  signupController,
};
