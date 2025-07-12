/**
 * Google AI Studio LLM (Gemini API) 서비스
 * 프론트엔드에서 직접 Google AI Studio와 통신
 */

// 환경 변수에서 API 키 가져오기
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = '/gemini/v1beta/models';

/**
 * 프로젝트 진행 상황 보고서 생성을 위한 시스템 프롬프트
 */
const PROJECT_REPORT_SYSTEM_PROMPT = `당신은 주어진 JSON 데이터를 바탕으로 프로젝트 진행 상황 보고서를 생성하는 AI 어시스턴트입니다.

당신의 임무는 프로젝트 주제, 팀 체크리스트, 그리고 익명으로 제공된 여러 구성원의 체크리스트를 처리하여 보고서를 생성하는 것입니다.

생성된 보고서는 아래의 세 가지 섹션으로 엄격하게 구성되어야 합니다:
- 어제까지 한 일
- 오늘 할 일  
- 궁금한/필요한/알아낸 것

보고서 생성 시 다음 규칙을 반드시 준수해야 합니다:

구조: 위에 명시된 세 가지 섹션 구조를 반드시 따라야 함.
언어: 보고서는 반드시 한국어로 작성해야 함.
작성 스타일: 답변은 '~합니다'와 같은 서술형 문장이 아닌, 'ㅇㅇ 완료', 'ㅁㅁ 필요' 와 같이 명사형으로 간결하게 마무리해야 함.

업무 취합:
"어제까지 한 일": "team_checklist"와 "member_checklists"에 있는 모든 "completed" 필드의 작업을 취합하여 목록으로 작성.
"오늘 할 일": 모든 "incomplete" 필드의 작업을 취합하여 목록으로 작성. 더불어, 개별 멤버에게 작업을 할당하지 말고, 팀 전체의 통합된 업무 목록으로 제시해야 함. 만약 없다면 최대 3개의 업무를 기존 완료한 것들을 바탕으로 제시해야 함.

'궁금한/필요한/알아낸 것' 섹션:
"inquiries" 필드의 정보를 사용하여 이 섹션을 작성함. 만약 "inquiries" 필드가 비어 있다면, "project_topic"을 참고하여 팀에 도움이 될 만한 관련 사항을 생성해야 함. 입력값에 URL이나 참조 링크가 포함된 경우, 해당 내용을 요약하되 URL 자체는 결과물에 포함하지 않아야 함.

빈 필드 처리: 만약 특정 섹션에 해당하는 입력 체크리스트가 비어 있다면, 해당 출력 섹션도 비워두어야 함.`;

/**
 * Gemini API 요청 기본 함수
 * @param {string} model - 사용할 모델명 (예: 'gemini-pro', 'gemini-pro-vision')
 * @param {Object} requestBody - 요청 본문
 * @returns {Promise<Object>} API 응답
 */
const geminiApiRequest = async (model, requestBody) => {
  console.log('API Key exists:', !!GEMINI_API_KEY);
  console.log('API Key length:', GEMINI_API_KEY ? GEMINI_API_KEY.length : 0);
  
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API 키가 설정되지 않았습니다. VITE_GEMINI_API_KEY 환경 변수를 확인해주세요.');
  }

  const url = `${GEMINI_API_URL}/${model}:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

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
        message: data.error?.message || 'Gemini API 요청에 실패했습니다.',
        status: response.status,
        data: data
      };
    }
  } catch (error) {
    console.error('Gemini API request failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return {
      success: false,
      message: `네트워크 오류가 발생했습니다: ${error.message}`,
      error: error
    };
  }
};

/**
 * 텍스트 기반 대화 생성
 * @param {string} prompt - 사용자 입력 프롬프트
 * @param {Array} history - 대화 히스토리 (선택사항)
 * @param {Object} options - 추가 옵션 (temperature, maxTokens 등)
 * @returns {Promise<Object>} 생성된 응답
 */
export const generateTextResponse = async (prompt, history = [], options = {}) => {
  const {
    temperature = 0.7,
    maxOutputTokens = 2048,
    topP = 0.8,
    topK = 40
  } = options;

  // 대화 히스토리와 현재 프롬프트를 결합
  const contents = [];
  
  // 히스토리가 있으면 추가
  if (history.length > 0) {
    contents.push(...history);
  }
  
  // 현재 프롬프트 추가
  contents.push({
    parts: [{ text: prompt }]
  });

  const requestBody = {
    contents: contents,
    generationConfig: {
      temperature: temperature,
      maxOutputTokens: maxOutputTokens,
      topP: topP,
      topK: topK
    }
  };

  return await geminiApiRequest('gemma-3-27b-it', requestBody);
};

/**
 * 응답에서 텍스트 추출
 * @param {Object} response - Gemini API 응답
 * @returns {string} 추출된 텍스트
 */
export const extractTextFromResponse = (response) => {
  if (!response.success || !response.data?.candidates) {
    return '';
  }

  const candidate = response.data.candidates[0];
  if (!candidate?.content?.parts) {
    return '';
  }

  return candidate.content.parts[0]?.text || '';
};

/**
 * 대화 히스토리 형식 변환
 * @param {Array} messages - 메시지 배열 [{role: 'user'|'assistant', content: string}]
 * @returns {Array} Gemini API 형식의 contents 배열
 */
export const formatConversationHistory = (messages) => {
  return messages.map(message => ({
    parts: [{ text: message.content }],
    role: message.role === 'user' ? 'user' : 'model'
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

/**
 * 프로젝트 진행 상황 보고서 생성
 * @param {Object} projectData - 프로젝트 데이터
 * @param {string} projectData.project_topic - 프로젝트 주제
 * @param {Object} projectData.team_checklist - 팀 체크리스트
 * @param {Array} projectData.member_checklists - 멤버 체크리스트 배열
 * @param {Array} projectData.inquiries - 궁금한/필요한/알아낸 것들
 * @returns {Promise<Object>} 생성된 보고서
 */
export const generateProjectReport = async (projectData) => {
  const prompt = `${PROJECT_REPORT_SYSTEM_PROMPT}

다음 JSON 데이터를 바탕으로 프로젝트 진행 상황 보고서를 생성해주세요:

${JSON.stringify(projectData, null, 2)}

위 데이터를 분석하여 세 가지 섹션으로 구성된 보고서를 생성해주세요.`;

  const response = await generateTextResponse(prompt, [], {
    temperature: 0.3, // 일관된 결과를 위해 낮은 temperature 사용
    maxOutputTokens: 2048
  });

  if (response.success) {
    const reportText = extractTextFromResponse(response);
    return {
      success: true,
      report: reportText,
      rawResponse: response.data
    };
  } else {
    return {
      success: false,
      error: response.message,
      rawResponse: response
    };
  }
}; 