// MySQL 접근
const mysql = require("mysql");
const { dbconfig, dbconfig_ai } = require("../DB/database");
// Tips DB 연결
const connection = mysql.createConnection(dbconfig);
connection.connect();
// AI DB 연결
const connection_AI = mysql.createConnection(dbconfig_ai);
connection_AI.connect();

const User_Table_Info = {
  table: "soyes_ai_User",
  attribute: {
    pKey: "uid",
    attr1: "Email",
    attr2: "passWard",
    attr3: "name",
    attr4: "phoneNumber",
    attr5: "oauth_type",
    attr6: "creation_date",
    attr7: "lastLogin_date",
  },
};

const user_ai_select = async (user_table, user_attribute, parsepUid) => {
  /* User DB 조회 */
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

  // 1. SELECT TEST (row가 있는지 없는지 검사)
  const select_query = `SELECT * FROM ${user_table} WHERE ${user_attribute.pKey}='${parsepUid}'`;
  const ebt_data = await fetchUserData(connection_AI, select_query);

  return ebt_data;
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
  // AI 회원가입
  postSignupAIHandler: async (req, res) => {
    const { SignUpData } = req.body;
    console.log(req.body);
    let parseSignUpData;
    const regex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/; // 한글 및 한글 자모를 포함하는 정규 표현식
    try {
      // 입력값 파싱
      if (typeof SignUpData === "string") {
        parseSignUpData = JSON.parse(SignUpData);
      } else parseSignUpData = SignUpData;

      const { pUid, Email, passWard, name, phoneNumber } = parseSignUpData;

      // Input 없을 경우
      if (!pUid || !passWard) {
        return res
          .status(400)
          .json({ message: "Non Sign Up Input Value - 400 Bad Request" });
      }

      // 입력값이 한글일 경우
      if (regex.test(pUid) || regex.test(passWard)) {
        return res
          .status(400)
          .json({ message: "Non Korean Input Value - 400 Bad Request" });
      }

      // User Table 명시
      const user_table = User_Table_Info.table;
      const user_attribute = User_Table_Info.attribute;

      // 오늘 날짜 변환
      const dateObj = new Date();
      const year = dateObj.getFullYear();
      const month = ("0" + (dateObj.getMonth() + 1)).slice(-2);
      const day = ("0" + dateObj.getDate()).slice(-2);
      const date = `${year}-${month}-${day}`;

      // 1. SELECT TEST (row가 있는지 없는지 검사)
      // User 계정 DB SELECT Method. uid를 입력값으로 받음
      const user_data = await user_ai_select(user_table, user_attribute, pUid);

      // 2. DUPLICATE USER (row가 있는 경우)
      if (user_data[0]) {
        // 같은 uid의 User가 이미 존재하는 경우
        return res
          .status(403)
          .json({ message: "Duplicate User - 403 Forbidden" });
      }
      // 3. INSERT USER (row가 없는 경우). 중복 검사 통과
      else {
        const insert_query = `INSERT INTO ${user_table} (${Object.values(
          user_attribute
        ).join(", ")}) VALUES (${Object.values(user_attribute)
          .map((el) => "?")
          .join(", ")})`;
        // console.log(insert_query);

        // INSERT Value 명시
        const insert_value_obj = {
          pKey: pUid,
          attr1: Email ? Email : null,
          attr2: passWard,
          attr3: name ? name : null,
          attr4: phoneNumber ? phoneNumber : null,
          attr5: "guest",
          attr6: date,
          attr7: date,
        };
        // console.log(insert_value);

        // 계정 생성 (비동기 처리)
        connection_AI.query(
          insert_query,
          Object.values(insert_value_obj),
          (error, rows, fields) => {
            if (error) {
              console.log(error);
              res.status(400).json({ message: error.sqlMessage });
            } else {
              console.log("Guest User Row DB INSERT Success!");
              res
                .status(200)
                .json({ message: "User SignUp Success! - 200 OK" });
            }
          }
        );
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server Error - 500 Bad Gateway" });
    }
  },
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
  signupController_Regercy,
};
