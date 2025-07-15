import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback, useState } from 'react';
import { analyzePose } from '../utils/poseAnalysis';

// 액션 타입 정의
const ACTIONS = {
  SET_INFERENCE_ENABLED: 'SET_INFERENCE_ENABLED',
  SET_NECK_ANGLE_CHECK: 'SET_NECK_ANGLE_CHECK',
  SET_FACE_POSITION_CHECK: 'SET_FACE_POSITION_CHECK',
  SET_KEYPOINTS: 'SET_KEYPOINTS',
  SET_IS_RECOGNIZED: 'SET_IS_RECOGNIZED',
  SET_LAST_ANALYSIS: 'SET_LAST_ANALYSIS',
  SET_CURRENT_ANALYSIS: 'SET_CURRENT_ANALYSIS',
  SET_SHOULD_NOTIFY: 'SET_SHOULD_NOTIFY',
  RESET_ANALYSIS: 'RESET_ANALYSIS'
};

// 초기 상태
const initialState = {
  // 설정
  isInferenceEnabled: false,
  neckAngleCheck: true,
  facePositionCheck: true,
  
  // 추론 데이터
  keypoints: null,
  isRecognized: false,
  
  // 분석 결과
  lastAnalysis: null,
  currentAnalysis: null,
  shouldNotify: false,
  
  // 내부 상태
  intervalId: null
};

// 리듀서
function poseInferenceReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_INFERENCE_ENABLED:
      return {
        ...state,
        isInferenceEnabled: action.payload
      };
    
    case ACTIONS.SET_NECK_ANGLE_CHECK:
      return {
        ...state,
        neckAngleCheck: action.payload
      };
    
    case ACTIONS.SET_FACE_POSITION_CHECK:
      return {
        ...state,
        facePositionCheck: action.payload
      };
    
    case ACTIONS.SET_KEYPOINTS:
      return {
        ...state,
        keypoints: action.payload
      };
    
    case ACTIONS.SET_IS_RECOGNIZED:
      return {
        ...state,
        isRecognized: action.payload
      };
    
    case ACTIONS.SET_LAST_ANALYSIS:
      return {
        ...state,
        lastAnalysis: action.payload
      };
    
    case ACTIONS.SET_CURRENT_ANALYSIS:
      return {
        ...state,
        currentAnalysis: action.payload
      };
    
    case ACTIONS.SET_SHOULD_NOTIFY:
      return {
        ...state,
        shouldNotify: action.payload
      };
    
    case ACTIONS.RESET_ANALYSIS:
      return {
        ...state,
        lastAnalysis: null,
        currentAnalysis: null,
        shouldNotify: false
      };
    
    default:
      return state;
  }
}

// Context 생성
const PoseInferenceContext = createContext();

// Provider 컴포넌트
export function PoseInferenceProvider({ children }) {
  const [state, dispatch] = useReducer(poseInferenceReducer, initialState);
  
  // 사용자가 설정하는 추론 간격 (기본 10초) - useState로 분리하여 관리
  const [inferenceInterval, setInferenceInterval] = useState(() => {
    const savedInterval = localStorage.getItem('inferenceInterval');
    return savedInterval ? parseInt(savedInterval, 10) : 10000;
  });

  // inferenceInterval이 변경될 때 localStorage에 저장
  useEffect(() => {
    localStorage.setItem('inferenceInterval', inferenceInterval);
  }, [inferenceInterval]);

  const intervalRef = useRef(null);
  const stateRef = useRef(state);
  const lastNotificationTimeRef = useRef(0); // 마지막 알림 발송 시간 추적
  const [isPageActive, setIsPageActive] = useState(true); // 페이지 활성화 상태
  const [isStretchingPage, setIsStretchingPage] = useState(false); // 스트레칭 페이지 여부
  
  // stateRef를 최신 상태로 업데이트
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // 페이지 활성화/비활성화 감지 (블러 기준)
  useEffect(() => {
    const handleFocus = () => {
      setIsPageActive(true);
      console.log('📱 페이지 포커스 - 활성화');
    };

    const handleBlur = () => {
      setIsPageActive(false);
      console.log('📱 페이지 블러 - 비활성화');
    };

    // 초기 상태 설정 (페이지가 포커스되어 있으면 활성화)
    setIsPageActive(document.hasFocus());

    // 이벤트 리스너 등록 (블러/포커스만 사용)
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // 스트레칭 페이지 여부 감지
  useEffect(() => {
    const checkStretchingPage = () => {
      const isStretching = window.location.hash === '#/stretching';
      setIsStretchingPage(isStretching);
      console.log('🏃 스트레칭 페이지 여부:', isStretching ? '스트레칭 페이지' : '다른 페이지');
    };

    // 초기 체크
    checkStretchingPage();

    // URL 변경 감지
    const handleHashChange = () => {
      checkStretchingPage();
    };

    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // 자세 교정이 필요한지 확인하는 함수
  const needsPostureCorrection = (analysis) => {
    // 분석이 없거나 유효하지 않으면 자세가 옳다고 가정 (감지되지 않음)
    if (!analysis || !analysis.isValid) {
      return false;
    }
    
    // 목 각도 확인이 활성화되어 있고 각도가 20도 초과인 경우
    if (state.neckAngleCheck && analysis.isAngleGreaterThan20) {
      console.log('⚠️ 목 각도 경고 감지:', analysis.shoulderNeckAngle, '도');
      return true;
    }
    
    // 얼굴 위치 확인이 활성화되어 있고 얼굴이 하단에 있는 경우
    if (state.facePositionCheck && analysis.faceInLowerHalf) {
      console.log('⚠️ 얼굴 위치 경고 감지: 하단에 위치');
      return true;
    }
    
    return false;
  };

  // 알림을 보내는 함수 (중복 방지)
  const sendNotification = () => {
    const now = Date.now();
    const timeSinceLastNotification = now - lastNotificationTimeRef.current;
    
    // 5초 내에 이미 알림을 보냈다면 중복 방지
    if (timeSinceLastNotification < 5000) {
      console.log('🔕 중복 알림 방지 (마지막 알림으로부터', Math.round(timeSinceLastNotification / 1000), '초)');
      return;
    }
    
    if (!('Notification' in window)) {
      console.log('이 브라우저는 알림을 지원하지 않습니다.');
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification('자세 교정 알림', {
        body: '잘못된 자세가 감지되었습니다. 자세를 교정해주세요.',
        tag: 'posture-correction'
      });
      
      // 알림 발송 시간 기록
      lastNotificationTimeRef.current = now;
      console.log('🔔 자세 교정 알림 발송 완료');
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          sendNotification();
        }
      });
    }
  };

  // 최신 상태를 사용하는 추론 함수를 useCallback으로 정의
  const runInferenceWithLatestState = useCallback(() => {
    const currentState = stateRef.current;
    
    // 현재 모드 결정 (stateRef를 통해 최신 상태 참조)
    let currentMode = '';
    const currentIsStretchingPage = window.location.hash === '#/stretching';
    const currentIsPageActive = isPageActive; // 블러 기준 활성화 상태 사용
    
    if (currentIsStretchingPage && currentIsPageActive) {
      currentMode = '스트레칭 페이지 활성화 모드 (1초)';
    } else if (currentIsPageActive) {
      // 분 단위가 아닌 초 단위로 표시하도록 수정
      currentMode = `다른 페이지 활성화 모드 (${Math.round(inferenceInterval / 1000)}초)`;
    } else {
      currentMode = `페이지 비활성화 모드 (${Math.round(inferenceInterval / 1000)}초)`;
    }
    
    if (currentState.keypoints) {
      // 실시간으로 최신 키포인트를 사용하여 분석
      const analysis = analyzePose(currentState.keypoints, 640);
      
      // 목 각도와 얼굴 위치 감지 시에만 로그 출력
      if (analysis.isValid) {
        const nose = currentState.keypoints[0];
        const leftShoulder = currentState.keypoints[5];
        const rightShoulder = currentState.keypoints[6];
        
        // 현재 페이지 상태 확인
        const currentIsStretchingPage = window.location.hash === '#/stretching';
        const currentIsPageActive = isPageActive; // 블러 기준 활성화 상태 사용
        
        console.log('🎯 포즈 감지:', {
          시간: new Date().toLocaleTimeString(),
          페이지: currentIsStretchingPage ? '스트레칭' : '다른페이지',
          활성화: currentIsPageActive ? '예' : '아니오',
          목각도: analysis.shoulderNeckAngle.toFixed(1) + '°',
          얼굴하단: analysis.faceInLowerHalf ? '예' : '아니오',
          각도경고: analysis.isAngleGreaterThan20 ? '예' : '아니오',
          코위치: nose ? `(${Math.round(nose.x)}, ${Math.round(nose.y)})` : '없음',
          왼쪽어깨: leftShoulder ? `(${Math.round(leftShoulder.x)}, ${Math.round(leftShoulder.y)})` : '없음',
          오른쪽어깨: rightShoulder ? `(${Math.round(rightShoulder.x)}, ${Math.round(rightShoulder.y)})` : '없음'
        });
      }
      
      // 현재 분석을 이전 분석으로 저장하고 새 분석을 현재로 설정
      const previousAnalysis = currentState.currentAnalysis;
      
      // 상태 업데이트
      dispatch({ type: ACTIONS.SET_LAST_ANALYSIS, payload: previousAnalysis });
      dispatch({ type: ACTIONS.SET_CURRENT_ANALYSIS, payload: analysis });
      
      // 이전과 현재 모두 자세 교정이 필요한 경우 알림
      const lastNeedsCorrection = needsPostureCorrection(previousAnalysis);
      const currentNeedsCorrection = needsPostureCorrection(analysis);
      
      // 페이지가 비활성화된 상태에서도 알림 발송
      const currentIsPageActive = isPageActive; // 블러 기준 활성화 상태 사용
      
      if (lastNeedsCorrection && currentNeedsCorrection) {
        dispatch({ type: ACTIONS.SET_SHOULD_NOTIFY, payload: true });
        
        // 페이지가 비활성화된 상태에서만 알림 발송
        if (!currentIsPageActive) {
          sendNotification();
        } else {
          console.log('🔔 자세 교정 필요 (페이지 활성화 상태 - 알림 발송 안함)');
        }
      } else {
        dispatch({ type: ACTIONS.SET_SHOULD_NOTIFY, payload: false });
      }
    }
  }, []); // 의존성 배열에서 isPageActive와 inferenceInterval 제거

  // 주기적인 추론 실행 로직 제거
  /*
  useEffect(() => {
    if (state.isInferenceEnabled) {
      // ... setInterval 로직 ...
    }
  }, [state.isInferenceEnabled, isPageActive, isStretchingPage, inferenceInterval, runInferenceWithLatestState]);
  */

  // 키포인트가 변경될 때마다 분석을 실행하도록 로직 변경
  useEffect(() => {
    if (state.isInferenceEnabled && state.isRecognized && state.keypoints) {
      console.log('🤸‍♂️ 키포인트 변경 감지, 자세 분석 실행');
      runInferenceWithLatestState();
    }
  }, [state.keypoints, state.isInferenceEnabled, state.isRecognized, runInferenceWithLatestState]);


  // 인식 상태가 false로 변경될 때 분석 리셋
  useEffect(() => {
    if (!state.isRecognized && state.isInferenceEnabled) {

      dispatch({ type: ACTIONS.RESET_ANALYSIS });
    }
  }, [state.isRecognized, state.isInferenceEnabled]);


  // 컴포넌트 언마운트 시 인터벌 정리
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Provider가 제공할 value 객체.
  // useReducer의 state와 dispatch, 그리고 useState로 관리하는 inferenceInterval 관련 값을 모두 포함.
  const value = {
    ...state,
    dispatch,
    inferenceInterval,
    setInferenceInterval,
    needsPostureCorrection, // 기존에 있던 함수들도 다시 포함
    sendNotification
  };

  return <PoseInferenceContext.Provider value={value}>{children}</PoseInferenceContext.Provider>;
}

// Custom Hook - 컨텍스트를 사용하기 쉽게 만들어주는 훅
export function usePoseInference() {
  const context = useContext(PoseInferenceContext);
  if (!context) {
    throw new Error('usePoseInference는 PoseInferenceProvider 내에서 사용되어야 합니다.');
  }
  return context;
} 