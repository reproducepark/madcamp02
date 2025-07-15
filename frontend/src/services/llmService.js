/**
 * Google AI Studio LLM (Gemini API) 서비스
 * @google/genai 라이브러리 사용
 */

import { GoogleGenAI } from "@google/genai";

// 환경 변수에서 API 키 가져오기
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

console.log('🔑 환경 변수 확인:');
console.log('VITE_GEMINI_API_KEY exists:', !!GEMINI_API_KEY);
console.log('VITE_GEMINI_API_KEY length:', GEMINI_API_KEY ? GEMINI_API_KEY.length : 0);
console.log('VITE_GEMINI_API_KEY preview:', GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 10)}...` : 'undefined');

// API 키가 없으면 에러 발생
if (!GEMINI_API_KEY) {
  throw new Error('VITE_GEMINI_API_KEY 환경 변수가 설정되지 않았습니다. .env 파일을 확인해주세요.');
}

// Google GenAI 클라이언트 초기화 - API 키를 명시적으로 전달
let ai;
try {
  ai = new GoogleGenAI(GEMINI_API_KEY);
  console.log('✅ Google GenAI 클라이언트 초기화 성공');
} catch (error) {
  console.error('❌ Google GenAI 클라이언트 초기화 실패:', error);
  throw error;
}

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
 * Google GenAI API 요청 기본 함수
 * @param {string} prompt - 사용자 입력 프롬프트
 * @param {Object} options - 추가 옵션 (temperature, maxTokens 등)
 * @returns {Promise<Object>} API 응답
 */
const geminiApiRequest = async (prompt, options = {}) => {
  console.log('API Key exists:', !!GEMINI_API_KEY);
  console.log('API Key length:', GEMINI_API_KEY ? GEMINI_API_KEY.length : 0);
  
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API 키가 설정되지 않았습니다. VITE_GEMINI_API_KEY 환경 변수를 확인해주세요.');
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        temperature: options.temperature || 0.7,
        maxOutputTokens: options.maxOutputTokens || 2048,
        topP: options.topP || 0.8,
        topK: options.topK || 40,
        thinkingConfig: {
          thinkingBudget: 0, // Disables thinking for faster response
        },
      }
    });

    return {
      success: true,
      data: response,
      text: response.text,
      status: 200
    };
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
  // 히스토리가 있으면 프롬프트에 포함
  let fullPrompt = prompt;
  if (history.length > 0) {
    const historyText = history.map(msg => `${msg.role}: ${msg.content}`).join('\n');
    fullPrompt = `${historyText}\n\n현재 요청: ${prompt}`;
  }

  return await geminiApiRequest(fullPrompt, options);
};

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

/**
 * 스크럼 생성 시스템 프롬프트
 */
const SCRUM_GENERATION_SYSTEM_PROMPT = `당신은 팀의 목표와 메모를 바탕으로 스크럼 페이지를 생성하는 AI 어시스턴트입니다.

주어진 팀 목표들과 메모들을 분석하여 다음 형식의 JSON을 생성해주세요:

{
  "sprint_title": "스프린트 제목",
  "sprint_duration": "스프린트 기간 (예: 2주)",
  "sprint_goals": [
    {
      "title": "목표 제목",
      "description": "목표 설명",
      "priority": "HIGH|MEDIUM|LOW",
      "estimated_hours": 숫자,
      "assignee": "담당자 (팀 전체 또는 특정 역할)",
      "acceptance_criteria": ["기준1", "기준2", "기준3"]
    }
  ],
  "team_notes": [
    "팀 메모에서 추출한 중요 사항들"
  ],
  "risks_and_blockers": [
    "잠재적 위험 요소나 차단 요소들"
  ],
  "next_actions": [
    "다음에 취해야 할 액션들"
  ]
}

생성 규칙:
1. 목표들은 기존 팀 목표들을 참고하여 더 구체적이고 실행 가능한 형태로 변환
2. 메모 내용을 분석하여 팀 노트와 위험 요소 추출
3. 모든 내용은 한국어로 작성
4. 우선순위는 목표의 중요도와 긴급성을 고려하여 설정
5. 예상 시간은 현실적이고 합리적인 범위로 설정
6. 담당자는 팀 전체 또는 역할 기반으로 설정`;

/**
 * 스크럼 페이지 생성
 * @param {Object} scrumData - 스크럼 데이터
 * @param {Array} scrumData.goals - 팀 목표 배열
 * @param {Array} scrumData.memos - 팀 메모 배열
 * @param {string} scrumData.teamName - 팀 이름
 * @returns {Promise<Object>} 생성된 스크럼 페이지
 */
export const generateScrumPage = async (scrumData) => {
  const prompt = `${SCRUM_GENERATION_SYSTEM_PROMPT}

다음 팀 데이터를 바탕으로 스크럼 페이지를 생성해주세요:

팀명: ${scrumData.teamName}

팀 목표들:
${JSON.stringify(scrumData.goals, null, 2)}

팀 메모들:
${JSON.stringify(scrumData.memos, null, 2)}

위 데이터를 분석하여 스크럼 페이지 JSON을 생성해주세요.`;

  const response = await generateTextResponse(prompt, [], {
    temperature: 0.4,
    maxOutputTokens: 4096
  });

  if (response.success) {
    const responseText = extractTextFromResponse(response);
    
    try {
      // JSON 응답을 파싱
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const scrumPageData = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          scrumPage: scrumPageData,
          rawResponse: responseText
        };
      } else {
        return {
          success: false,
          error: 'JSON 형식의 응답을 찾을 수 없습니다.',
          rawResponse: responseText
        };
      }
    } catch (parseError) {
      return {
        success: false,
        error: `JSON 파싱 오류: ${parseError.message}`,
        rawResponse: responseText
      };
    }
  } else {
    return {
      success: false,
      error: response.message,
      rawResponse: response
    };
  }
}; 