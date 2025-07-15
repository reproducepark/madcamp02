/**
 * Google AI Studio LLM (Gemini API) 서비스
 * Electron 메인 프로세스를 통한 API 호출
 */

// Electron 환경에서 메인 프로세스로 API 호출
const isElectron = window.electronAPI !== undefined;

console.log('🔧 LLM 서비스 초기화:');
console.log('Electron 환경:', isElectron);

if (!isElectron) {
  console.error('❌ Electron 환경이 아닙니다. LLM 서비스를 사용할 수 없습니다.');
}

/**
 * 응답에서 텍스트 추출
 * @param {Object} response - Gemini API 응답
 * @returns {string} 추출된 텍스트
 */
export const extractTextFromResponse = (response) => {
  if (!response.success || !response.text) {
    return '';
  }
  return response.text;
};

/**
 * 대화 히스토리 형식 변환
 * @param {Array} messages - 메시지 배열 [{role: 'user'|'assistant', content: string}]
 * @returns {Array} Gemini API 형식의 contents 배열
 */
export const formatConversationHistory = (messages) => {
  return messages.map(message => ({
    role: message.role === 'user' ? 'user' : 'assistant',
    content: message.content
  }));
};

/**
 * 에러 메시지 처리
 * @param {Object} error - 에러 객체
 * @returns {string} 사용자 친화적인 에러 메시지
 */
export const handleLLMError = (error) => {
  if (error.message?.includes('API 키')) {
    return 'API 키가 설정되지 않았습니다. 환경 변수를 확인해주세요.';
  }
  
  if (error.message?.includes('quota')) {
    return 'API 사용량 한도를 초과했습니다.';
  }
  
  if (error.message?.includes('rate limit')) {
    return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
  }
  
  return error.message || 'LLM 서비스에서 오류가 발생했습니다.';
};