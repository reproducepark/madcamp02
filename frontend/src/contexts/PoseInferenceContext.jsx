import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
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
  inferenceInterval: 3, // 분 단위
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

  // 자세 교정이 필요한지 확인하는 함수
  const needsPostureCorrection = (analysis) => {
    if (!analysis || !analysis.isValid) return false;
    
    // 목 각도 확인이 활성화되어 있고 각도가 20도 초과인 경우
    if (state.neckAngleCheck && analysis.isAngleGreaterThan20) {
      return true;
    }
    
    // 얼굴 위치 확인이 활성화되어 있고 얼굴이 하단에 있는 경우
    if (state.facePositionCheck && analysis.faceInLowerHalf) {
      return true;
    }
    
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

  // 주기적 추론 실행
  useEffect(() => {
    if (state.isInferenceEnabled && state.isRecognized && state.keypoints) {
      // 기존 인터벌 정리
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // 새로운 인터벌 설정 (분을 밀리초로 변환)
      const intervalMs = state.inferenceInterval * 60 * 1000;
      
      intervalRef.current = setInterval(() => {
        console.log('⏰ 전역 추론 인터벌 실행:', {
          키포인트존재: !!state.keypoints,
          추론주기: state.inferenceInterval,
          인식상태: state.isRecognized
        });
        
        if (state.keypoints) {
          const analysis = analyzePose(state.keypoints, 640);
          console.log('🔍 포즈 분석 완료:', {
            목각도: analysis.shoulderNeckAngle,
            얼굴하단: analysis.faceInLowerHalf,
            각도경고: analysis.isAngleGreaterThan20,
            유효성: analysis.isValid
          });
          
          // 이전 분석 결과를 lastAnalysis로 이동
          dispatch({ type: ACTIONS.SET_LAST_ANALYSIS, payload: state.currentAnalysis });
          dispatch({ type: ACTIONS.SET_CURRENT_ANALYSIS, payload: analysis });
          
          // 이전과 현재 모두 자세 교정이 필요한 경우 알림
          const lastNeedsCorrection = needsPostureCorrection(state.currentAnalysis);
          const currentNeedsCorrection = needsPostureCorrection(analysis);
          
          console.log('⚠️ 자세 교정 필요 여부:', {
            이전: lastNeedsCorrection,
            현재: currentNeedsCorrection,
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
      }, intervalMs);

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
    state.facePositionCheck
  ]);

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