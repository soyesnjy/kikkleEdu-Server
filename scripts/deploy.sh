#!/bin/bash
pwd

sudo docker ps -a -q --filter "name=soyes-server-jenkins" | grep -q . && docker stop soyes-server-jenkins && docker rm >

# 기존 이미지 삭제
# sudo docker rmi soyesnjy/njy:1

# 도커허브 이미지 pull
# sudo docker pull soyesnjy/njy:1

# 도커 run
# docker run -d -p 4040:4040 --name soyes-server-jenkins soyesnjy/njy:1

# 사용하지 않는 불필요한 이미지 삭제 -> 현재 컨테이너가 물고 있는 이미지는 삭제되지 않습니다.
# docker rmi -f $(docker images -f "dangling=true" -q) || true