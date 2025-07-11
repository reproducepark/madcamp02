import React, { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";

// 모델 경로. 실제 모델 파일 위치에 맞게 수정해주세요.
// public 폴더 안에 model 폴더를 만들고 model.json과 weights.bin 파일을 넣어두면 좋습니다.
const MODEL_URL = "/model/model.json";

const KEYPOINT_NAMES = [
  "코", "왼쪽 눈", "오른쪽 눈", "왼쪽 귀", "오른쪽 귀",
  "왼쪽 어깨", "오른쪽 어깨", "왼쪽 팔꿈치", "오른쪽 팔꿈치",
  "왼쪽 손목", "오른쪽 손목", "왼쪽 엉덩이", "오른쪽 엉덩이",
  "왼쪽 무릎", "오른쪽 무릎", "왼쪽 발목", "오른쪽 발목"
];

// 키포인트 연결선 정의 (예: MoveNet의 스켈레톤과 유사하게)
// 이 연결선은 바운딩 박스와 별개로 사람의 자세를 더 명확하게 보여줍니다.
const KEYPOINT_CONNECTIONS = [
    [0, 1], [0, 2], // 코-눈
    [1, 3], [2, 4], // 눈-귀
    [5, 6],         // 어깨
    [5, 7], [7, 9], // 왼쪽 팔
    [6, 8], [8, 10], // 오른쪽 팔
    [5, 11], [6, 12], // 어깨-엉덩이
    [11, 12],       // 엉덩이
    [11, 13], [13, 15], // 왼쪽 다리
    [12, 14], [14, 16]  // 오른쪽 다리
];


function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // 웹캠 연결
  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 640 } // 모델 입력 크기와 동일하게 설정
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (error) {
        console.error("웹캠 접근 오류:", error);
        setErrorMessage("웹캠에 접근할 수 없습니다. 브라우저 권한을 확인해주세요.");
      }
    }
    setupCamera();
  }, []);

  // 모델 로드
  useEffect(() => {
    async function loadModel() {
      setLoading(true);
      setErrorMessage(""); // 에러 메시지 초기화
      try {
        const loadedModel = await tf.loadGraphModel(MODEL_URL);
        setModel(loadedModel);
        console.log("모델 로드 완료:", loadedModel);
      } catch (error) {
        console.error("모델 로드 오류:", error);
        setErrorMessage("모델을 로드할 수 없습니다. 경로를 확인하거나 파일이 올바른지 확인하세요.");
      } finally {
        setLoading(false);
      }
    }
    loadModel();
  }, []);

  // 실시간 추론 루프
  useEffect(() => {
    let intervalId;
    // 모델이 로드되지 않았거나, 비디오 요소가 없으면 실행하지 않음
    if (!model || !videoRef.current) return;

    // 프레임률을 제한할 시간 간격 (밀리초)
    // 100ms는 약 10 FPS에 해당합니다. 값을 높이면 프레임률이 낮아지고, 낮추면 높아집니다.
    const FRAME_RATE_MS = 200; 

    const runPose = async () => {
      if (!videoRef.current || videoRef.current.readyState !== 4) {
        // 비디오가 아직 준비되지 않았으면 다음 프레임에 다시 시도 (setInterval이 다음 틱에 다시 실행할 것임)
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!canvas) {
          // 캔버스 요소가 없으면 중단
          console.warn("Canvas element not found. Stopping pose estimation.");
          clearInterval(intervalId); // 인터벌 중지
          return;
      }
      const ctx = canvas.getContext("2d");
      const modelInputSize = 640; // 모델 입력 크기

      // 1. 비디오 프레임을 640x640 캔버스에 레터박싱하여 그림
      ctx.fillStyle = '#000000'; // 검은색으로 배경 채우기
      ctx.fillRect(0, 0, modelInputSize, modelInputSize);

      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      let scaledWidth, scaledHeight;
      const aspectRatio = videoWidth / videoHeight;

      if (aspectRatio > 1) { // 비디오가 가로로 더 길면, 폭을 640으로 맞추고 높이 조정
        scaledWidth = modelInputSize;
        scaledHeight = modelInputSize / aspectRatio;
      } else { // 비디오가 세로로 더 길거나 정사각형이면, 높이를 640으로 맞추고 폭 조정
        scaledHeight = modelInputSize;
        scaledWidth = modelInputSize * aspectRatio;
      }

      const offsetX = (modelInputSize - scaledWidth) / 2;
      const offsetY = (modelInputSize - scaledHeight) / 2;

      ctx.drawImage(video, offsetX, offsetY, scaledWidth, scaledHeight);

      // 2. 캔버스 픽셀을 텐서로 변환
      const input = tf.browser.fromPixels(canvas)
        .toFloat()
        .div(tf.scalar(255))
        .expandDims(0);

      let output = null;
      let processedOutput = null;

      try {
        // 3. 추론
        output = model.predict(input);
        // console.log("원시 output.shape:", output.shape); // 디버깅용

        // YOLOv8/11 pose 모델의 출력 형태에 따라 전치
        // 일반적으로 YOLOv8 Pose 모델은 [1, 56, N] (N은 박스 수) 또는 [1, N, 56] 형태로 출력됩니다.
        // N은 보통 8400 (640x640 입력의 경우) 입니다.
        // 이 코드는 [1, 56, 8400] -> [1, 8400, 56]으로 전치하는 것을 가정합니다.
        if (output.shape && output.shape.length === 3 && output.shape[1] === 56 && output.shape[2] === 8400) {
          processedOutput = output.transpose([0, 2, 1]); // [1, 8400, 56]
        } else {
          // 다른 형태이거나 이미 올바른 형태인 경우 (예: [1, 8400, 56])
          processedOutput = output;
        }
        // console.log("전치 후 processedOutput.shape:", processedOutput.shape); // 디버깅용

        const arr = await processedOutput.array();
        const detections = arr ? arr[0] : []; // 배치 차원 제거. arr이 null 또는 undefined인 경우 빈 배열로 처리

        // 4. 키포인트 및 바운딩 박스 시각화
        // 매 프레임마다 drawImage에서 이전 프레임 내용을 덮어쓰므로 ctx.clearRect는 필요하지 않습니다.

        ctx.lineWidth = 2; // 바운딩 박스 선 굵기
        ctx.strokeStyle = 'lime'; // 바운딩 박스 색상
        ctx.fillStyle = 'red'; // 키포인트 색상 (점)
        ctx.font = '12px Arial'; // 텍스트 폰트 설정 (신뢰도 표시용)


        detections.forEach((det) => {
            // YOLOv8 Pose 출력 포맷: [x_center, y_center, width, height, confidence, class_0_conf, ..., kx1, ky1, kv1, ..., kx17, ky17, kv17]
            // 여기서는 class_0_conf만 유의미하다고 가정 (사람 클래스)
            const confidence = det && det.length > 4 ? det[4] : 0; // 바운딩 박스 신뢰도

            // 바운딩 박스 신뢰도 임계값 조정 (0.25 -> 0.45 또는 더 낮게/높게 조절 가능)
            // 너무 낮으면 오탐이 많아지고, 너무 높으면 탐지가 잘 안될 수 있습니다.
            const BBOX_CONF_THRESHOLD = 0.25; // 디버깅을 위해 이 값을 다시 조정할 수 있습니다.

            const KEYPOINT_VIS_THRESHOLD = 0.3; // 키포인트 가시성/신뢰도 임계값

            if (confidence > BBOX_CONF_THRESHOLD) {
                // 바운딩 박스 (모델 출력은 640x640 스케일의 중심 기준 좌표)
                const x_center = det && det.length > 0 ? det[0] : 0;
                const y_center = det && det.length > 1 ? det[1] : 0;
                const width = det && det.length > 2 ? det[2] : 0;
                const height = det && det.length > 3 ? det[3] : 0;

                // 캔버스에 그릴 좌상단 좌표 계산
                const x1 = x_center - width / 2;
                const y1 = y_center - height / 2;

                // 바운딩 박스 그리기
                ctx.beginPath();
                ctx.rect(x1, y1, width, height);
                ctx.stroke();

                // 신뢰도 텍스트 표시
                ctx.fillStyle = 'white';
                ctx.fillText(`Confidence: ${confidence.toFixed(2)}`, x1, y1 > 10 ? y1 - 5 : y1 + 15);
                ctx.fillStyle = 'red'; // 키포인트 색상으로 다시 설정

                const keypoints = [];
                // 키포인트 추출 및 그리기
                for (let i = 0; i < 17; i++) {
                    const kx = det && det.length > (5 + i * 3) ? det[5 + i * 3] : 0;
                    const ky = det && det.length > (5 + i * 3 + 1) ? det[5 + i * 3 + 1] : 0;
                    const visibility = det && det.length > (5 + i * 3 + 2) ? det[5 + i * 3 + 2] : 0; // 키포인트 가시성/신뢰도 (0~1)

                    if (visibility > KEYPOINT_VIS_THRESHOLD) {
                        ctx.beginPath();
                        ctx.arc(kx, ky, 4, 0, 2 * Math.PI); // 반지름 4 픽셀
                        ctx.fill();
                        keypoints.push({ x: kx, y: ky, score: visibility, name: KEYPOINT_NAMES[i] });
                    } else {
                        keypoints.push(null); // 감지되지 않은 키포인트는 null로 처리
                    }
                }

                // 키포인트 연결선 그리기
                ctx.strokeStyle = 'cyan'; // 연결선 색상
                ctx.lineWidth = 2; // 연결선 두께
                KEYPOINT_CONNECTIONS.forEach(([p1Index, p2Index]) => {
                    const p1 = keypoints[p1Index];
                    const p2 = keypoints[p2Index];

                    if (p1 && p2 && p1.score > KEYPOINT_VIS_THRESHOLD && p2.score > KEYPOINT_VIS_THRESHOLD) {
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                });
                ctx.strokeStyle = 'lime'; // 바운딩 박스 색상으로 다시 설정
            }
        });

      } catch (error) {
        console.error("추론 및 시각화 오류:", error);
        setErrorMessage("추론 중 오류가 발생했습니다. 콘솔을 확인해주세요.");
      } finally {
        // 텐서 메모리 해제
        input.dispose();
        if (output) output.dispose();
        if (processedOutput && processedOutput !== output) processedOutput.dispose();
        // tf.disposeVariables(); // 이 부분은 주석 처리하는 것이 일반적인 실시간 추론 시나리오에 더 적합합니다.
                               // 모델 변수를 매 프레임마다 해제할 필요는 없습니다.
      }
    };

    // 모델이 로드되고 비디오가 재생될 준비가 되면 추론 시작
    videoRef.current.addEventListener('loadeddata', () => {
        if (model) {
            // requestAnimationFrame 대신 setInterval 사용
            intervalId = setInterval(runPose, FRAME_RATE_MS);
        }
    }, { once: true }); // 한 번만 실행되도록 { once: true } 추가

    // 모델이 나중에 로드되는 경우를 대비 (비디오가 이미 준비되었을 때)
    if (model && videoRef.current.readyState === 4 && !intervalId) { // 이미 인터벌이 설정되지 않은 경우에만
        intervalId = setInterval(runPose, FRAME_RATE_MS);
    }


    // 컴포넌트 언마운트 시 인터벌 및 웹캠 스트림 정리
    return () => {
      clearInterval(intervalId); // 인터벌 중지
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [model]); // model이 변경될 때만 이 useEffect를 다시 실행

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>YOLO11n-pose 실시간 웹캠 추론</h1>
      {loading && <p>모델 로딩 중...</p>}
      {errorMessage && <p style={{ color: "red" }}>오류: {errorMessage}</p>}
      <video
        ref={videoRef}
        width={640}
        height={640}
        style={{ display: "none" }} // 비디오 스트림은 숨기고 캔버스에 그립니다.
        playsInline // iOS 등 모바일 환경에서 자동 재생을 위해 필요
        muted // 자동 재생 시 음소거 필수
      />
      <canvas
        ref={canvasRef}
        width={640}
        height={640}
        style={{ border: "1px solid #ccc", background: "black" }} // 캔버스 배경을 검은색으로 설정
      />
      {!loading && !errorMessage && (
        <p style={{ marginTop: "10px", color: "#555" }}>
          웹캠이 켜지지 않으면 브라우저 권한을 확인하거나, 잠시 기다려주세요.<br />
          모델이 로드되었고 웹캠이 준비되면 추론이 시작됩니다.
        </p>
      )}
    </div>
  );
}

export default App;