import { getAuthHeaders } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * 기본 API 요청 함수
 * @param {string} endpoint - API 엔드포인트
 * @param {Object} options - fetch 옵션
 * @returns {Promise<Object>} API 응답
 */
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: getAuthHeaders(),
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        data: data,
        status: response.status
      };
    } else {
      return {
        success: false,
        message: data.message || '요청에 실패했습니다.',
        status: response.status,
        data: data
      };
    }
  } catch (error) {
    console.error('API request failed:', error);
    return {
      success: false,
      message: '네트워크 오류가 발생했습니다.',
      error: error
    };
  }
};

/**
 * GET 요청
 * @param {string} endpoint - API 엔드포인트
 * @param {Object} headers - 추가 헤더
 * @returns {Promise<Object>} API 응답
 */
export const apiGet = (endpoint, headers = {}) => {
  return apiRequest(endpoint, {
    method: 'GET',
    headers: { ...getAuthHeaders(), ...headers }
  });
};

/**
 * POST 요청
 * @param {string} endpoint - API 엔드포인트
 * @param {Object} data - 전송할 데이터
 * @param {Object} headers - 추가 헤더
 * @returns {Promise<Object>} API 응답
 */
export const apiPost = (endpoint, data, headers = {}) => {
  return apiRequest(endpoint, {
    method: 'POST',
    headers: { ...getAuthHeaders(), ...headers },
    body: JSON.stringify(data)
  });
};

/**
 * PUT 요청
 * @param {string} endpoint - API 엔드포인트
 * @param {Object} data - 전송할 데이터
 * @param {Object} headers - 추가 헤더
 * @returns {Promise<Object>} API 응답
 */
export const apiPut = (endpoint, data, headers = {}) => {
  return apiRequest(endpoint, {
    method: 'PUT',
    headers: { ...getAuthHeaders(), ...headers },
    body: JSON.stringify(data)
  });
};

/**
 * DELETE 요청
 * @param {string} endpoint - API 엔드포인트
 * @param {Object} headers - 추가 헤더
 * @returns {Promise<Object>} API 응답
 */
export const apiDelete = (endpoint, headers = {}) => {
  return apiRequest(endpoint, {
    method: 'DELETE',
    headers: { ...getAuthHeaders(), ...headers }
  });
};

/**
 * 파일 업로드 요청
 * @param {string} endpoint - API 엔드포인트
 * @param {FormData} formData - 파일 데이터
 * @param {Object} headers - 추가 헤더
 * @returns {Promise<Object>} API 응답
 */
export const apiUpload = (endpoint, formData, headers = {}) => {
  const token = localStorage.getItem('token');
  const uploadHeaders = {
    ...headers,
    ...(token && { 'Authorization': `Bearer ${token}` })
  };

  return apiRequest(endpoint, {
    method: 'POST',
    headers: uploadHeaders,
    body: formData
  });
};


/**
 * PATCH 요청
 * @param {string} endpoint - API 엔드포인트
 * @param {Object} data - 전송할 데이터
 * @param {Object} headers - 추가 헤더
 * @returns {Promise<Object>} API 응답
 */
export const apiPatch = (endpoint, data, headers = {}) => {
  return apiRequest(endpoint, {
    method: 'PATCH',
    headers: { ...getAuthHeaders(), ...headers },
    body: JSON.stringify(data)
  });
};


/**
 * 에러 메시지 처리
 * @param {Object} error - 에러 객체
 * @returns {string} 사용자 친화적인 에러 메시지
 */
export const handleApiError = (error) => {
  if (error.response) {
    // 서버에서 응답이 왔지만 에러 상태인 경우
    const status = error.response.status;
    switch (status) {
      case 400:
        return '잘못된 요청입니다.';
      case 401:
        return '인증이 필요합니다.';
      case 403:
        return '접근 권한이 없습니다.';
      case 404:
        return '요청한 리소스를 찾을 수 없습니다.';
      case 500:
        return '서버 오류가 발생했습니다.';
      default:
        return error.response.data?.message || '알 수 없는 오류가 발생했습니다.';
    }
  } else if (error.request) {
    // 요청은 보냈지만 응답을 받지 못한 경우
    return '서버에 연결할 수 없습니다.';
  } else {
    // 요청 자체를 보내지 못한 경우
    return '네트워크 오류가 발생했습니다.';
  }
}; 