# 사용할 Node.js의 버전을 명시합니다.
FROM node:18

# 애플리케이션 디렉토리를 생성합니다.
WORKDIR /usr/src/app

# 애플리케이션 의존성 설치를 위한 파일들을 복사합니다.
# package.json 과 package-lock.json (if available)
COPY package*.json ./

# 패키지를 설치합니다.
RUN npm install

# # pm2를 글로벌로 설치합니다.
RUN npm install pm2 -g

# 애플리케이션 소스를 복사합니다.
COPY . .

# 애플리케이션이 사용할 포트를 명시합니다.
# EXPOSE 4000

# 애플리케이션을 Node.js로 직접 실행합니다.
# CMD ["node", "app.js"]

# # 애플리케이션을 pm2로 실행합니다.
CMD ["pm2-runtime", "start", "app.js"]
