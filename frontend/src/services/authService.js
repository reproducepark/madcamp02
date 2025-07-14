const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * 사용자 로그인 API
 * @param {string} username - 사용자 아이디
 * @param {string} password - 사용자 비밀번호
 * @returns {Promise<Object>} 로그인 결과
 */
export const loginUser = async (username, password) => {
  console.log('AuthService: loginUser() 시작', { username: username ? '존재함' : '없음' });
  try {
    const response = await fetch(`/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // 로그인 성공 시 토큰과 사용자 정보를 로컬 스토리지에 저장
      console.log('AuthService: 로그인 성공, 데이터 저장 시작');
      localStorage.setItem('token', data.token);
      localStorage.setItem('userInfo', JSON.stringify(data.user));
      
      // 자동 로그인을 위한 정보 저장
      console.log('AuthService: 자동 로그인 데이터 저장 시도');
      const autoLoginData = { username, password };
      localStorage.setItem('autoLogin', JSON.stringify(autoLoginData));
      console.log('AuthService: 자동 로그인 데이터 저장 완료:', { username: username ? '존재함' : '없음' });
      
      console.log('AuthService: 저장된 사용자 정보:', localStorage.getItem('userInfo'));
      return {
        success: true,
        data: data,
        message: '로그인 성공'
      };
    } else {
      console.log('AuthService: 로그인 실패:', data.message);
      return {
        success: false,
        message: data.message || '로그인에 실패했습니다.'
      };
    }
  } catch (error) {
    console.error('AuthService: Login failed:', error);
    return {
      success: false,
      message: '로그인 중 오류가 발생했습니다. 다시 시도해주세요.'
    };
  }
};

/**
 * 사용자 회원가입 API
 * @param {string} username - 사용자 아이디
 * @param {string} password - 사용자 비밀번호
 * @returns {Promise<Object>} 회원가입 결과
 */
export const registerUser = async (username, password, name, class_section) => {
  try {
    const response = await fetch(`/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password, name, class_section }),
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
  localStorage.removeItem('userInfo');
  localStorage.removeItem('autoLogin'); // 자동 로그인 정보도 제거
  // 추가적인 로그아웃 로직이 필요하다면 여기에 구현
  // 페이지를 강제로 리로드하여 모든 상태를 초기화
  window.location.href = '/#/login';
};

/**
 * 현재 로그인된 사용자의 토큰 확인
 * @returns {string|null} 토큰 또는 null
 */
export const getAuthToken = () => {
  const token = localStorage.getItem('token');
  console.log('AuthService: getAuthToken() - token:', token ? '존재함' : '없음');
  return token;
};

/**
 * 현재 로그인된 사용자 정보 조회
 * @returns {Object|null} 사용자 정보 또는 null
 */
export const getCurrentUser = () => {
  const userInfo = localStorage.getItem('userInfo');
  console.log('AuthService: getCurrentUser() - userInfo:', userInfo ? '존재함' : '없음');
  return userInfo ? JSON.parse(userInfo) : null;
};

/**
 * 사용자가 로그인되어 있는지 확인
 * @returns {boolean} 로그인 상태
 */
export const isAuthenticated = () => {
  const token = getAuthToken();
  const result = !!token;
  console.log('AuthService: isAuthenticated() - 결과:', result);
  return result;
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

/**
 * 자동 로그인 시도
 * @returns {Promise<Object>} 자동 로그인 결과
 */
export const tryAutoLogin = async () => {
  console.log('AuthService: tryAutoLogin() 시작');
  try {
    const autoLoginData = localStorage.getItem('autoLogin');
    console.log('AuthService: autoLoginData 존재 여부:', !!autoLoginData);
    console.log('AuthService: autoLoginData 원본 값:', autoLoginData);
    
    if (!autoLoginData) {
      console.log('AuthService: 자동 로그인 데이터 없음');
      return { success: false, message: '자동 로그인 정보가 없습니다.' };
    }

    const { username, password } = JSON.parse(autoLoginData);
    console.log('AuthService: 파싱된 자동 로그인 데이터:', { username: username ? '존재함' : '없음', password: password ? '존재함' : '없음' });
    
    if (!username || !password) {
      console.log('AuthService: 자동 로그인 데이터 불완전');
      return { success: false, message: '자동 로그인 정보가 불완전합니다.' };
    }

    // 토큰이 이미 유효한지 확인
    const currentToken = getAuthToken();
    if (currentToken) {
      console.log('AuthService: 이미 토큰이 존재함');
      // 토큰 유효성 검증 (선택사항)
      return { success: true, message: '이미 로그인되어 있습니다.' };
    }

    console.log('AuthService: 자동 로그인 API 호출 시작');
    // 자동 로그인 시도
    const result = await loginUser(username, password);
    console.log('AuthService: 자동 로그인 API 결과:', result);
    return result;
  } catch (error) {
    console.error('AuthService: 자동 로그인 실패:', error);
    return {
      success: false,
      message: '자동 로그인에 실패했습니다.'
    };
  }
};

/**
 * 자동 로그인 정보 제거
 * @returns {void}
 */
export const clearAutoLogin = () => {
  localStorage.removeItem('autoLogin');
};

/**
 * 자동 로그인 정보 저장
 * @param {string} username - 사용자 아이디
 * @param {string} password - 사용자 비밀번호
 * @returns {void}
 */
export const saveAutoLogin = (username, password) => {
  localStorage.setItem('autoLogin', JSON.stringify({ username, password }));
}; 