# <img width="32" height="32" alt="icon_1024_tp" src="https://github.com/user-attachments/assets/c67ea644-9466-4b42-b13a-7114a1e70f18" /> 몰입메이트

![KakaoTalk_20250716_184452134](https://github.com/user-attachments/assets/d53a1321-26a7-4aa5-ba24-8fb83bcd3cf8)

|팀원|github|
|------|---|
|박재현|https://github.com/reproducepark|
|윤신이|https://github.com/tlsdl6942|

### ✨ 소개
몰입메이트는 언제 어디서든 당신이 몰입할 수 있게 도와줍니다. 팀별 목표와 개인별 목표를 설정하고 스크럼을 생성해 보세요. 타이머를 통한 시간관리와 자세 교정은 덤!

### 🚀 기술 스택
<p align="center">
  <a href="https://skillicons.dev">
    <img src="https://skillicons.dev/icons?i=electron,react,nodejs,tensorflow,docker,postgres" />
  </a>
</p>
- 서비스 아키텍처
<img width="1313" height="531" alt="image" src="https://github.com/user-attachments/assets/33d1691a-d455-4647-95a2-086364b908fd" />

**Electron**

- Electron 기반 Windows/MacOS 겸용 크로스 플랫폼 어플리케이션
- 사용자는 Renderer process 조작, Computing은 Main process에서 이루어짐

**Main process**

- Main process는 Node.js를 기반으로 동작
- Global pose tracking과 Global timer는 Main process에서 동작하며 Singleton pattern으로 작성
- Pose tracking은 TensorFlow.js용으로 포팅한 YOLO11n-pose 모델을 통해 동작, WebGL을 통해 연산하여 궁극적으로 클라이언트의 CPU, GPU를 통해 추론
- Gemini 서버, 백엔드와의 통신도 Main process가 담당

**Server**

- Proxmox hypervisor는 Debian LXC와 Ubuntu VM으로 구성
- Reverse proxy는 LXC에서, 백엔드 및 DB는 VM 내부 Docker container에서 구동
- 백엔드와 DB는 virtual network 내에서 통신

### 🛠️ 설치 및 실행 방법
- MacOS : dmg 파일 다운로드 및 실행 - https://github.com/reproducepark/madcamp02/releases/tag/mac
- Windows : 인스톨러 다운로드 및 실행 - https://github.com/reproducepark/madcamp02/releases/tag/win
