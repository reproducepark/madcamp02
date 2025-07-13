// src/components/PoseDetectionComponent.jsx
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
    [5, 6],         // 어깨
    [5, 7], [7, 9], // 왼쪽 팔
    [6, 8], [8, 10], // 오른쪽 팔
    [5, 11], [6, 12], // 어깨-엉덩이
    [11, 12],       // 엉덩이
    [11, 13], [13, 15], // 왼쪽 다리
    [12, 14], [14, 16]  // 오른쪽 다리
];

function PoseDetectionComponent({ videoRef, onRecognitionChange }) {
  const canvasRef = useRef(null);
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

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

    // 프레임률을 1 FPS로 설정 (1000ms)
    const FRAME_RATE_MS = 1000; 

    const runPose = async () => {
      if (!videoRef.current || videoRef.current.readyState !== 4) {
        // 비디오가 아직 준비되지 않았으면 다음 프레임에 다시 시도
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!canvas) {
        console.warn("Canvas element not found. Stopping pose estimation.");
        clearInterval(intervalId);
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

        // YOLOv8/11 pose 모델의 출력 형태에 따라 전치
        if (output.shape && output.shape.length === 3 && output.shape[1] === 56 && output.shape[2] === 8400) {
          processedOutput = output.transpose([0, 2, 1]); // [1, 8400, 56]
        } else {
          processedOutput = output;
        }

        const arr = await processedOutput.array();
        const detections = arr ? arr[0] : [];

        // 4. 가장 높은 신뢰도를 가진 감지 결과 찾기
        const BBOX_CONF_THRESHOLD = 0.25;
        const KEYPOINT_VIS_THRESHOLD = 0.3;

        let bestDetection = null;
        let highestConfidence = 0;

        // 가장 높은 신뢰도를 가진 감지 결과 찾기
        detections.forEach((det) => {
          const confidence = det && det.length > 4 ? det[4] : 0;
          if (confidence > BBOX_CONF_THRESHOLD && confidence > highestConfidence) {
            highestConfidence = confidence;
            bestDetection = det;
          }
        });

        // 5. 가장 높은 신뢰도의 키포인트만 시각화
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'lime';
        ctx.fillStyle = 'red';
        ctx.font = '12px Arial';

        let hasValidDetection = false;

        if (bestDetection) {
          hasValidDetection = true;
          
          // 바운딩 박스
          const x_center = bestDetection[0];
          const y_center = bestDetection[1];
          const width = bestDetection[2];
          const height = bestDetection[3];

          const x1 = x_center - width / 2;
          const y1 = y_center - height / 2;

          // 바운딩 박스 그리기
          ctx.beginPath();
          ctx.rect(x1, y1, width, height);
          ctx.stroke();

          // 신뢰도 텍스트 표시
          ctx.fillStyle = 'white';
          ctx.fillText(`Confidence: ${highestConfidence.toFixed(2)}`, x1, y1 > 10 ? y1 - 5 : y1 + 15);
          ctx.fillStyle = 'red';

          const keypoints = [];
          // 키포인트 추출 및 그리기
          for (let i = 0; i < 17; i++) {
            const kx = bestDetection[5 + i * 3];
            const ky = bestDetection[5 + i * 3 + 1];
            const visibility = bestDetection[5 + i * 3 + 2];

            if (visibility > KEYPOINT_VIS_THRESHOLD) {
              ctx.beginPath();
              ctx.arc(kx, ky, 4, 0, 2 * Math.PI);
              ctx.fill();
              keypoints.push({ x: kx, y: ky, score: visibility, name: KEYPOINT_NAMES[i] });
            } else {
              keypoints.push(null);
            }
          }

          // 키포인트 연결선 그리기
          ctx.strokeStyle = 'cyan';
          ctx.lineWidth = 2;
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
          ctx.strokeStyle = 'lime';
        }

        // 인식 상태 변경 콜백 호출
        if (onRecognitionChange) {
          onRecognitionChange(hasValidDetection);
        }

      } catch (error) {
        console.error("추론 및 시각화 오류:", error);
        setErrorMessage("추론 중 오류가 발생했습니다. 콘솔을 확인해주세요.");
      } finally {
        // 텐서 메모리 해제
        input.dispose();
        if (output) output.dispose();
        if (processedOutput && processedOutput !== output) processedOutput.dispose();
      }
    };

    // 모델이 로드되고 비디오가 재생될 준비가 되면 추론 시작
    videoRef.current.addEventListener('loadeddata', () => {
      if (model) {
        intervalId = setInterval(runPose, FRAME_RATE_MS);
      }
    }, { once: true });

    // 모델이 나중에 로드되는 경우를 대비
    if (model && videoRef.current.readyState === 4 && !intervalId) {
      intervalId = setInterval(runPose, FRAME_RATE_MS);
    }

    // 컴포넌트 언마운트 시 인터벌 정리
    return () => {
      clearInterval(intervalId);
    };
  }, [model, videoRef, onRecognitionChange]);

  if (loading) {
    return <div className="pose-loading">포즈 인식 모델 로딩 중...</div>;
  }

  if (errorMessage) {
    return <div className="pose-error">오류: {errorMessage}</div>;
  }

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={640}
      className="pose-canvas"
    />
  );
}

export default PoseDetectionComponent; 