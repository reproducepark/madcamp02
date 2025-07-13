// 포즈 분석 유틸리티 함수들

/**
 * 얼굴이 웹캠 화면의 하단에 있는지 확인하는 함수
 * @param {Array} keypoints - 키포인트 배열 (x, y, score 포함)
 * @param {number} canvasHeight - 캔버스 높이
 * @param {number} threshold - 하단 영역 임계값 (0.6 = 화면 하단 40% 영역)
 * @returns {boolean} 얼굴이 하단에 있으면 true
 */
export function isFaceInLowerHalf(keypoints, canvasHeight, threshold = 0.6) {
  if (!keypoints || keypoints.length === 0) {
    return false;
  }

  // 얼굴 키포인트들 (코, 왼쪽 눈, 오른쪽 눈, 왼쪽 귀, 오른쪽 귀)
  const faceKeypoints = [0, 1, 2, 3, 4];
  let validFacePoints = 0;
  let totalY = 0;

  faceKeypoints.forEach(index => {
    const keypoint = keypoints[index];
    if (keypoint && keypoint.score > 0.3) { // 신뢰도 임계값
      totalY += keypoint.y;
      validFacePoints++;
    }
  });

  if (validFacePoints === 0) {
    return false;
  }

  // 얼굴의 평균 Y 위치 계산
  const averageFaceY = totalY / validFacePoints;
  
  // 화면 하단 임계값 계산
  const lowerThreshold = canvasHeight * threshold;
  
  return averageFaceY > lowerThreshold;
}

/**
 * 어깨와 목의 각도를 계산하는 함수
 * @param {Array} keypoints - 키포인트 배열
 * @returns {number|null} 각도 (도 단위), 계산할 수 없으면 null
 */
export function calculateShoulderNeckAngle(keypoints) {
  if (!keypoints || keypoints.length < 7) {
    return null;
  }

  // 필요한 키포인트 인덱스
  const leftShoulder = keypoints[5];  // 왼쪽 어깨
  const rightShoulder = keypoints[6]; // 오른쪽 어깨
  const nose = keypoints[0];          // 코 (목의 대략적인 위치)

  // 모든 키포인트가 유효한지 확인
  if (!leftShoulder || !rightShoulder || !nose) {
    return null;
  }

  // 신뢰도 확인
  if (leftShoulder.score < 0.3 || rightShoulder.score < 0.3 || nose.score < 0.3) {
    return null;
  }

  // 어깨의 중점 계산
  const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
  const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2;

  // 어깨 중점에서 코까지의 벡터
  const neckVectorX = nose.x - shoulderCenterX;
  const neckVectorY = nose.y - shoulderCenterY;

  // 수직 벡터 (위쪽 방향)
  const verticalVectorX = 0;
  const verticalVectorY = -1;

  // 각도 계산 (도 단위)
  const dotProduct = neckVectorX * verticalVectorX + neckVectorY * verticalVectorY;
  const neckMagnitude = Math.sqrt(neckVectorX * neckVectorX + neckVectorY * neckVectorY);
  const verticalMagnitude = 1;

  if (neckMagnitude === 0) {
    return null;
  }

  const cosAngle = dotProduct / (neckMagnitude * verticalMagnitude);
  const angleInRadians = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
  const angleInDegrees = (angleInRadians * 180) / Math.PI;

  return angleInDegrees;
}

/**
 * 어깨와 목의 각도가 20도보다 큰지 확인하는 함수
 * @param {Array} keypoints - 키포인트 배열
 * @param {number} threshold - 각도 임계값 (기본값: 20도)
 * @returns {boolean} 각도가 임계값보다 크면 true
 */
export function isShoulderNeckAngleGreaterThan(keypoints, threshold = 20) {
  const angle = calculateShoulderNeckAngle(keypoints);
  
  if (angle === null) {
    return false;
  }

  return angle > threshold;
}

/**
 * 포즈 상태를 종합적으로 분석하는 함수
 * @param {Array} keypoints - 키포인트 배열
 * @param {number} canvasHeight - 캔버스 높이
 * @returns {Object} 분석 결과
 */
export function analyzePose(keypoints, canvasHeight) {
  const faceInLowerHalf = isFaceInLowerHalf(keypoints, canvasHeight);
  const shoulderNeckAngle = calculateShoulderNeckAngle(keypoints);
  const isAngleGreaterThan20 = isShoulderNeckAngleGreaterThan(keypoints, 20);

  return {
    faceInLowerHalf,
    shoulderNeckAngle,
    isAngleGreaterThan20,
    isValid: shoulderNeckAngle !== null
  };
}

/**
 * 포즈 교정 가이드 메시지를 생성하는 함수
 * @param {Object} poseAnalysis - 포즈 분석 결과
 * @returns {string} 교정 가이드 메시지
 */
export function getPoseCorrectionMessage(poseAnalysis) {
  const messages = [];

  if (poseAnalysis.faceInLowerHalf) {
    messages.push("얼굴을 화면 상단으로 올려주세요.");
  }

  if (poseAnalysis.isValid && poseAnalysis.shoulderNeckAngle > 20) {
    messages.push("목을 더 들어올려주세요. (현재 각도: " + Math.round(poseAnalysis.shoulderNeckAngle) + "도)");
  }

  if (messages.length === 0) {
    return "좋은 자세입니다!";
  }

  return messages.join(" ");
} 