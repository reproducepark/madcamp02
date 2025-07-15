import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback, useState } from 'react';
import { analyzePose } from '../utils/poseAnalysis';

// 액션 타입 정의
const ACTIONS = {
  SET_INFERENCE_ENABLED: 'SET_INFERENCE_ENABLED',
  SET_INFERENCE_INTERVAL: 'SET_INFERENCE_INTERVAL',
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
  inferenceInterval: 1/6, // 10초 (1/6분)
  neckAngleCheck: false,
  facePositionCheck: false,
  
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
    
    case ACTIONS.SET_INFERENCE_INTERVAL:
      return {
        ...state,
        inferenceInterval: action.payload
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
  const intervalRef = useRef(null);
  const stateRef = useRef(state);
  const [isPageActive, setIsPageActive] = useState(true); // 페이지 활성화 상태
  const [isStretchingPage, setIsStretchingPage] = useState(false); // 스트레칭 페이지 여부
  
  // stateRef를 최신 상태로 업데이트
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // 페이지 활성화/비활성화 감지
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isActive = !document.hidden;
      setIsPageActive(isActive);
      console.log('📱 페이지 활성화 상태 변경:', isActive ? '활성화' : '비활성화');
    };

    const handleFocus = () => {
      setIsPageActive(true);
      console.log('📱 페이지 포커스 - 활성화');
    };

    const handleBlur = () => {
      setIsPageActive(false);
      console.log('📱 페이지 블러 - 비활성화');
    };

    // 초기 상태 설정
    setIsPageActive(!document.hidden);

    // 이벤트 리스너 등록
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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
      console.log('📷 감지되지 않음 - 자세가 옳다고 가정');
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
    
    console.log('✅ 자세 정상');
    return false;
  };

  // 알림을 보내는 함수
  const sendNotification = () => {
    if (!('Notification' in window)) {
      console.log('이 브라우저는 알림을 지원하지 않습니다.');
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification('자세 교정 알림', {
        body: '잘못된 자세가 감지되었습니다. 자세를 교정해주세요.',
        icon: '/vite.svg',
        tag: 'posture-correction'
      });
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
    const currentIsPageActive = !document.hidden;
    
    if (currentIsStretchingPage && currentIsPageActive) {
      currentMode = '스트레칭 페이지 활성화 모드 (1초)';
    } else if (currentIsPageActive) {
      currentMode = `다른 페이지 활성화 모드 (${currentState.inferenceInterval}분)`;
    } else {
      currentMode = `페이지 비활성화 모드 (${currentState.inferenceInterval}분)`;
    }
    
    console.log('⏰ 전역 추론 인터벌 실행 - 시간:', new Date().toLocaleTimeString(), {
      키포인트존재: !!currentState.keypoints,
      모드: currentMode,
      인식상태: currentState.isRecognized,
      스트레칭페이지: currentIsStretchingPage,
      페이지활성화: currentIsPageActive
    });
    
    if (currentState.keypoints) {
      // 키포인트 변경 확인을 위한 로그
      const nose = currentState.keypoints[0];
      const leftShoulder = currentState.keypoints[5];
      const rightShoulder = currentState.keypoints[6];
      
      console.log('🎯 현재 키포인트 상태 - 시간:', new Date().toLocaleTimeString(), {
        코위치: nose ? `(${Math.round(nose.x)}, ${Math.round(nose.y)})` : '없음',
        왼쪽어깨위치: leftShoulder ? `(${Math.round(leftShoulder.x)}, ${Math.round(leftShoulder.y)})` : '없음',
        오른쪽어깨위치: rightShoulder ? `(${Math.round(rightShoulder.x)}, ${Math.round(rightShoulder.y)})` : '없음'
      });
      
      // 실시간으로 최신 키포인트를 사용하여 분석
      const analysis = analyzePose(currentState.keypoints, 640);
      console.log('🔍 포즈 분석 완료:', {
        목각도: analysis.shoulderNeckAngle,
        얼굴하단: analysis.faceInLowerHalf,
        각도경고: analysis.isAngleGreaterThan20,
        유효성: analysis.isValid
      });
      
      // 현재 분석을 이전 분석으로 저장하고 새 분석을 현재로 설정
      const previousAnalysis = currentState.currentAnalysis;
      console.log('📋 이전 분석 결과:', previousAnalysis);
      
      // 상태 업데이트
      dispatch({ type: ACTIONS.SET_LAST_ANALYSIS, payload: previousAnalysis });
      dispatch({ type: ACTIONS.SET_CURRENT_ANALYSIS, payload: analysis });
      
      // 이전과 현재 모두 자세 교정이 필요한 경우 알림
      const lastNeedsCorrection = needsPostureCorrection(previousAnalysis);
      const currentNeedsCorrection = needsPostureCorrection(analysis);
      
      console.log('⚠️ 자세 교정 필요 여부:', {
        이전분석: previousAnalysis,
        이전교정필요: lastNeedsCorrection,
        현재교정필요: currentNeedsCorrection,
        알림발송: lastNeedsCorrection && currentNeedsCorrection
      });
      
      if (lastNeedsCorrection && currentNeedsCorrection) {
        dispatch({ type: ACTIONS.SET_SHOULD_NOTIFY, payload: true });
        sendNotification();
        console.log('🔔 자세 교정 알림 발송됨');
      } else {
        dispatch({ type: ACTIONS.SET_SHOULD_NOTIFY, payload: false });
      }
    } else {
      console.log('❌ 키포인트가 없어서 분석 불가');
    }
  }, [dispatch, needsPostureCorrection, sendNotification]);

  // 주기적 추론 실행
  useEffect(() => {
    if (state.isInferenceEnabled && state.isRecognized && state.keypoints) {
      // 기존 인터벌 정리
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // 스트레칭 페이지와 페이지 활성화 상태에 따라 추론 주기 결정
      let intervalMs;
      let mode = '';
      
      // 현재 상태를 직접 확인
      const currentIsStretchingPage = window.location.hash === '#/stretching';
      const currentIsPageActive = !document.hidden;
      
      if (currentIsStretchingPage && currentIsPageActive) {
        // 스트레칭 페이지가 활성화되어 있으면 1초마다
        intervalMs = 1000;
        mode = '스트레칭 페이지 활성화 모드 (1초)';
      } else if (currentIsPageActive) {
        // 다른 페이지가 활성화되어 있으면 설정된 시간에 맞게
        intervalMs = state.inferenceInterval * 60 * 1000;
        mode = `다른 페이지 활성화 모드 (${state.inferenceInterval}분)`;
      } else {
        // 페이지가 비활성화되어 있으면 설정된 시간에 맞게
        intervalMs = state.inferenceInterval * 60 * 1000;
        mode = `페이지 비활성화 모드 (${state.inferenceInterval}분)`;
      }
      
      console.log('⏰ 전역 추론 인터벌 설정 - 시간:', new Date().toLocaleTimeString(), {
        모드: mode,
        인터벌밀리초: intervalMs,
        키포인트존재: !!state.keypoints,
        스트레칭페이지: currentIsStretchingPage,
        페이지활성화: currentIsPageActive
      });
      
      // 추론 실행 함수 정의
      intervalRef.current = setInterval(runInferenceWithLatestState, intervalMs);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      // 추론이 비활성화되거나 인식되지 않은 경우 인터벌 정리
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [
    state.isInferenceEnabled, 
    state.isRecognized, 
    state.keypoints, 
    state.inferenceInterval,
    state.neckAngleCheck,
    state.facePositionCheck,
    runInferenceWithLatestState
  ]);

  // 페이지 상태 변경 시 인터벌 재설정
  useEffect(() => {
    if (state.isInferenceEnabled && state.isRecognized && state.keypoints) {
      // 기존 인터벌 정리
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // 현재 상태를 직접 확인
      const currentIsStretchingPage = window.location.hash === '#/stretching';
      const currentIsPageActive = !document.hidden;
      
      // 추론 주기 결정
      let intervalMs;
      let mode = '';
      
      if (currentIsStretchingPage && currentIsPageActive) {
        intervalMs = 1000;
        mode = '스트레칭 페이지 활성화 모드 (1초)';
      } else if (currentIsPageActive) {
        intervalMs = state.inferenceInterval * 60 * 1000;
        mode = `다른 페이지 활성화 모드 (${state.inferenceInterval}분)`;
      } else {
        intervalMs = state.inferenceInterval * 60 * 1000;
        mode = `페이지 비활성화 모드 (${state.inferenceInterval}분)`;
      }
      
      console.log('🔄 페이지 상태 변경으로 인한 인터벌 재설정 - 시간:', new Date().toLocaleTimeString(), {
        모드: mode,
        인터벌밀리초: intervalMs,
        스트레칭페이지: currentIsStretchingPage,
        페이지활성화: currentIsPageActive
      });
      
      // 새로운 인터벌 설정
      intervalRef.current = setInterval(runInferenceWithLatestState, intervalMs);
    }
  }, [isPageActive, isStretchingPage, state.isInferenceEnabled, state.isRecognized, state.keypoints, state.inferenceInterval, runInferenceWithLatestState]);

  // 키포인트가 변경될 때마다 즉시 분석 업데이트
  useEffect(() => {
    if (state.isInferenceEnabled && state.isRecognized && state.keypoints) {
      console.log('🔄 키포인트 변경 감지 - 즉시 분석 실행');
      
      const analysis = analyzePose(state.keypoints, 640);
      console.log('🔍 키포인트 변경으로 인한 즉시 분석:', {
        목각도: analysis.shoulderNeckAngle,
        얼굴하단: analysis.faceInLowerHalf,
        각도경고: analysis.isAngleGreaterThan20,
        유효성: analysis.isValid
      });
      
      // 현재 분석을 이전 분석으로 저장하고 새 분석을 현재로 설정
      const previousAnalysis = state.currentAnalysis;
      
      // 상태 업데이트
      dispatch({ type: ACTIONS.SET_LAST_ANALYSIS, payload: previousAnalysis });
      dispatch({ type: ACTIONS.SET_CURRENT_ANALYSIS, payload: analysis });
      
      // 자세 교정 필요 여부 확인
      const lastNeedsCorrection = needsPostureCorrection(previousAnalysis);
      const currentNeedsCorrection = needsPostureCorrection(analysis);
      
      if (lastNeedsCorrection && currentNeedsCorrection) {
        dispatch({ type: ACTIONS.SET_SHOULD_NOTIFY, payload: true });
        sendNotification();
        console.log('🔔 키포인트 변경으로 인한 자세 교정 알림 발송됨');
      } else {
        dispatch({ type: ACTIONS.SET_SHOULD_NOTIFY, payload: false });
      }
    } else if (state.isInferenceEnabled && state.isRecognized && !state.keypoints) {
      // 키포인트가 null인 경우 (감지되지 않음)
      console.log('🔄 키포인트 null 감지 - 분석 리셋');
      dispatch({ type: ACTIONS.SET_CURRENT_ANALYSIS, payload: null });
      dispatch({ type: ACTIONS.SET_SHOULD_NOTIFY, payload: false });
    }
  }, [state.keypoints, state.isInferenceEnabled, state.isRecognized]);

  // 인식 상태가 false로 변경될 때 분석 리셋
  useEffect(() => {
    if (!state.isRecognized && state.isInferenceEnabled) {
      console.log('🔄 인식 상태 false 감지 - 분석 리셋');
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

  const value = {
    ...state,
    dispatch,
    needsPostureCorrection,
    sendNotification
  };

  return (
    <PoseInferenceContext.Provider value={value}>
      {children}
    </PoseInferenceContext.Provider>
  );
}

// Hook
export function usePoseInference() {
  const context = useContext(PoseInferenceContext);
  if (!context) {
    throw new Error('usePoseInference는 PoseInferenceProvider 내에서 사용되어야 합니다.');
  }
  return context;
} 