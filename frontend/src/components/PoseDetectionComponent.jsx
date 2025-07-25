// src/components/PoseDetectionComponent.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";

// 모델 경로를 동적으로 설정
const getModelUrl = () => {
  // 개발 환경에서는 상대 경로 사용
  if (import.meta.env.DEV) {
    return "/model/model.json";
  }
  
  // Electron 환경에서는 file:// 프로토콜 사용
  if (window.electronAPI) {
    return "./model/model.json";
  }
  
  // 웹 환경에서는 상대 경로 사용
  return "./model/model.json";
};

const MODEL_URL = getModelUrl();

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

function PoseDetectionComponent({ videoRef, onRecognitionChange, onKeypointsChange, customInterval }) {
  const canvasRef = useRef(null);
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const intervalRef = useRef(null);

  // 모델 로드
  useEffect(() => {
    async function loadModel() {
      console.log("🤖 포즈 추론 모델 로드 시작...");
      
      setLoading(true);
      setErrorMessage("");
      
      // 여러 경로를 시도
      const modelPaths = [
        MODEL_URL,
        "/model/model.json",
        "./model/model.json",
        "model/model.json"
      ];
      
      for (let i = 0; i < modelPaths.length; i++) {
        const path = modelPaths[i];
        
        try {
          await tf.ready();
          
          const loadedModel = await tf.loadGraphModel(path, {
            onProgress: (fraction) => {
              console.log(`📊 모델 로드 진행률: ${(fraction * 100).toFixed(1)}%`);
            }
          });
          
          console.log("✅ 포즈 추론 모델 로드 완료");
          
          setModel(loadedModel);
          setLoading(false);
          return; // 성공하면 함수 종료
          
        } catch (error) {
          console.error(`❌ 모델 로드 실패 (${path}):`, error.message);
          continue; // 다음 경로 시도
        }
      }
      
      // 모든 경로가 실패한 경우
      console.error("❌ 모든 모델 경로에서 로드 실패");
      setErrorMessage("모델을 로드할 수 없습니다. 모델 파일이 올바른 위치에 있는지 확인해주세요.");
      setLoading(false);
    }
    
    loadModel();
  }, []);

  // runPose 함수를 useCallback으로 정의
  const runPose = useCallback(async () => {
    
    const video = videoRef.current;
    if (!video) {
      console.log("❌ 비디오 ref 없음");
      return;
    }
    
    if (video.readyState !== 4) {
      console.log("❌ 비디오 준비되지 않음 (readyState:", video.readyState, ")");
      return;
    }
    const canvas = canvasRef.current;
    

    
    // Canvas 요소 존재 여부를 더 안전하게 확인
    if (!canvas) {
      console.warn("❌ Canvas element not found. Waiting for canvas to be ready...");
      return;
    }
    
    // Canvas가 DOM에 실제로 연결되어 있는지 확인
    if (!document.contains(canvas)) {
      console.warn("❌ Canvas element not in DOM. Waiting...");
      return;
    }
    


    const ctx = canvas.getContext("2d");
    const modelInputSize = 640; // 모델 입력 크기

    // 1. 캔버스를 투명하게 초기화
    ctx.clearRect(0, 0, modelInputSize, modelInputSize);

    // 2. 추론용 임시 캔버스 생성 (화면에 표시되지 않음)
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = modelInputSize;
    tempCanvas.height = modelInputSize;
    const tempCtx = tempCanvas.getContext('2d');

    // 3. 비디오 프레임을 임시 캔버스에 그리기
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

    // 임시 캔버스에 비디오 프레임 그리기
    tempCtx.drawImage(video, offsetX, offsetY, scaledWidth, scaledHeight);

    // 4. 임시 캔버스 픽셀을 텐서로 변환
    const input = tf.browser.fromPixels(tempCanvas)
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
      // 비디오 크기에 맞게 스케일링 팩터 계산
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const scaleX = canvasWidth / modelInputSize;
      const scaleY = canvasHeight / modelInputSize;
      
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(0, 255, 0, 0)'; // 투명한 라임색
      ctx.fillStyle = 'rgba(255, 0, 0, 0)'; // 투명한 빨간색
      ctx.font = '12px Arial';

      let hasValidDetection = false;
      let faceDetected = false;
      let leftShoulderDetected = false;
      let rightShoulderDetected = false;

      if (bestDetection) {
        hasValidDetection = true;
        
        // 바운딩 박스
        const x_center = bestDetection[0];
        const y_center = bestDetection[1];
        const width = bestDetection[2];
        const height = bestDetection[3];

        const x1 = x_center - width / 2;
        const y1 = y_center - height / 2;

        // 바운딩 박스 그리기 (스케일링 적용)
        ctx.beginPath();
        ctx.rect(x1 * scaleX, y1 * scaleY, width * scaleX, height * scaleY);
        ctx.stroke();

        // 신뢰도 텍스트 표시 (스케일링 적용) - 투명하게 설정
        ctx.fillStyle = 'rgba(255, 255, 255, 0)'; // 투명한 흰색
        ctx.fillText(`Confidence: ${highestConfidence.toFixed(2)}`, x1 * scaleX, y1 * scaleY > 10 ? y1 * scaleY - 5 : y1 * scaleY + 15);
        ctx.fillStyle = 'rgba(255, 0, 0, 0)'; // 투명한 빨간색

        const keypoints = [];
        // 키포인트 추출 및 그리기
        for (let i = 0; i < 17; i++) {
          const kx = bestDetection[5 + i * 3];
          const ky = bestDetection[5 + i * 3 + 1];
          const visibility = bestDetection[5 + i * 3 + 2];

          if (visibility > KEYPOINT_VIS_THRESHOLD) {
            ctx.beginPath();
            ctx.arc(kx * scaleX, ky * scaleY, 4, 0, 2 * Math.PI);
            ctx.fill();
            keypoints.push({ x: kx * scaleX, y: ky * scaleY, score: visibility, name: KEYPOINT_NAMES[i] });
            
            // 얼굴 키포인트 확인 (코, 왼쪽 눈, 오른쪽 눈, 왼쪽 귀, 오른쪽 귀)
            if (i >= 0 && i <= 4) {
              faceDetected = true;
            }
            // 어깨 키포인트 확인 (왼쪽 어깨, 오른쪽 어깨)
            if (i === 5) { // 왼쪽 어깨
              leftShoulderDetected = true;
            }
            if (i === 6) { // 오른쪽 어깨
              rightShoulderDetected = true;
            }
          } else {
            keypoints.push(null);
          }
        }

        // 키포인트 데이터를 상위 컴포넌트로 전달
        if (onKeypointsChange) {
          if (hasValidDetection) {
            onKeypointsChange(keypoints);
          } else {
            // 유효하지 않을 때 null 전달
            onKeypointsChange(null);
          }
        }

        // 키포인트 연결선 그리기 - 투명하게 설정
        ctx.strokeStyle = 'rgba(0, 255, 255, 0)'; // 투명한 시안색
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
        ctx.strokeStyle = 'rgba(0, 255, 0, 0)'; // 투명한 라임색
      }

      // 얼굴과 양쪽 어깨가 모두 인식되었을 때만 유효한 감지로 판단
      hasValidDetection = hasValidDetection && faceDetected && leftShoulderDetected && rightShoulderDetected;

      // 인식 상태 변경 콜백 호출
      if (onRecognitionChange) {
        onRecognitionChange(hasValidDetection);
      }

    } catch (error) {
      console.error("추론 및 시각화 오류:", error);
      setErrorMessage("추론 중 오류가 발생했습니다. 콘솔을 확인해주세요.");
    } finally {
      // 텐서 메모리 해제
      try {
        input.dispose();
        if (output) output.dispose();
        if (processedOutput && processedOutput !== output) processedOutput.dispose();
        
        // 임시 캔버스 정리
        if (tempCanvas) {
          tempCanvas.width = 0;
          tempCanvas.height = 0;
        }
      } catch (disposeError) {
        console.warn("텐서 메모리 해제 중 오류:", disposeError);
      }
    }
  }, [model, onRecognitionChange, onKeypointsChange]);

  // 추론 시작 및 중지 관리
  useEffect(() => {
    if (!model || !videoRef.current || !canvasRef.current) {
      return;
    }

    const startPoseEstimation = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // customInterval이 있으면 사용, 없으면 기본값 1초
      const interval = customInterval || 1000;
      intervalRef.current = setInterval(runPose, interval);
      console.log(`✅ 포즈 추론 인터벌 시작 (${interval}ms 간격)`);
    };

    const stopPoseEstimation = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    // 비디오가 이미 준비된 경우
    if (videoRef.current.readyState === 4) {
      startPoseEstimation();
    } else {
      // 비디오가 준비될 때까지 대기
      const handleLoadedData = () => {
        startPoseEstimation();
      };

      videoRef.current.addEventListener('loadeddata', handleLoadedData, { once: true });
      
      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('loadeddata', handleLoadedData);
        }
        stopPoseEstimation();
      };
    }

    return stopPoseEstimation;
  }, [model, videoRef.current, canvasRef.current]);

  // customInterval이 변경될 때마다 인터벌 재설정
  useEffect(() => {
    if (model && videoRef.current && canvasRef.current && intervalRef.current) {
      console.log(`🔄 추론 주기 변경: ${customInterval || 1000}ms`);
      
      // 기존 인터벌 정리
      clearInterval(intervalRef.current);
      
      // 새로운 인터벌 설정
      const interval = customInterval || 1000;
      intervalRef.current = setInterval(runPose, interval);
      console.log(`✅ 포즈 추론 인터벌 재설정 (${interval}ms 간격)`);
    }
  }, [customInterval, model]);

  if (loading) {
    return (
      <div className="pose-loading">
        <div>모델 로딩 중...</div>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
          환경: {import.meta.env.DEV ? '개발' : '프로덕션'}
        </div>
      </div>
    );
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
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 10,
        width: '100%',
        height: '100%'
      }}
    />
  );
}

export default PoseDetectionComponent; 