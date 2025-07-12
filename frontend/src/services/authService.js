const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * 사용자 로그인 API
 * @param {string} id - 사용자 아이디
 * @param {string} password - 사용자 비밀번호
 * @returns {Promise<Object>} 로그인 결과
 */
export const loginUser = async (id, password) => {
  try {
    const response = await fetch(`/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, password }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // 로그인 성공 시 토큰을 로컬 스토리지에 저장
      localStorage.setItem('token', data.token);
      return {
        success: true,
        data: data,
        message: '로그인 성공'
      };
    } else {
      return {
        success: false,
        message: data.message || '로그인에 실패했습니다.'
      };
    }
  } catch (error) {
    console.error('Login failed:', error);
    return {
      success: false,
      message: '로그인 중 오류가 발생했습니다. 다시 시도해주세요.'
    };
  }
};

/**
 * 사용자 회원가입 API
 * @param {string} id - 사용자 아이디
 * @param {string} password - 사용자 비밀번호
 * @returns {Promise<Object>} 회원가입 결과
 */
export const registerUser = async (id, password) => {
  try {
    const response = await fetch(`/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, password }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return {
        success: true,
        data: data,
        message: '회원가입이 완료되었습니다!'
      };
    } else {
      return {
        success: false,
        message: data.message || '회원가입에 실패했습니다.'
      };
    }
  } catch (error) {
    console.error('Registration failed:', error);
    return {
      success: false,
      message: '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.'
    };
  }
};

/**
 * 사용자 로그아웃
 * @returns {void}
 */
export const logoutUser = () => {
  localStorage.removeItem('token');
  // 추가적인 로그아웃 로직이 필요하다면 여기에 구현
  // 페이지를 강제로 리로드하여 모든 상태를 초기화
  window.location.href = '/#/login';
};

/**
 * 현재 로그인된 사용자의 토큰 확인
 * @returns {string|null} 토큰 또는 null
 */
export const getAuthToken = () => {
  return localStorage.getItem('token');
};

/**
 * 사용자가 로그인되어 있는지 확인
 * @returns {boolean} 로그인 상태
 */
export const isAuthenticated = () => {
  const token = getAuthToken();
  return !!token;
};

/**
 * API 요청에 인증 헤더 추가
 * @param {Object} headers - 기존 헤더
 * @returns {Object} 인증 헤더가 포함된 헤더
 */
export const getAuthHeaders = (headers = {}) => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...headers,
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
}; 