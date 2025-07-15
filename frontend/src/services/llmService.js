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
 * Google GenAI API 요청 기본 함수
 * @param {string} prompt - 사용자 입력 프롬프트
 * @param {Object} options - 추가 옵션 (temperature, maxTokens 등)
 * @returns {Promise<Object>} API 응답
 */
const geminiApiRequest = async (prompt, options = {}) => {
  console.log('🚀 LLM API 요청 시작');
  
  if (!isElectron) {
    return {
      success: false,
      message: 'Electron 환경에서만 사용할 수 있습니다.',
      error: new Error('Electron 환경이 아닙니다.')
    };
  }

  try {
    console.log('📡 Electron 메인 프로세스로 API 호출');
    const response = await window.electronAPI.llmGenerateText(prompt, [], options);
    console.log('✅ Electron API 호출 성공');
    return response;
  } catch (error) {
    console.error('❌ Electron API 호출 실패:', error);
    return {
      success: false,
      message: `Electron API 오류: ${error.message}`,
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
  console.log('📊 프로젝트 보고서 생성 시작');
  
  if (!isElectron) {
    return {
      success: false,
      error: 'Electron 환경에서만 사용할 수 있습니다.',
      rawResponse: null
    };
  }

  try {
    console.log('📡 Electron 메인 프로세스로 프로젝트 보고서 생성 요청');
    const response = await window.electronAPI.llmGenerateProjectReport(projectData);
    console.log('✅ Electron 프로젝트 보고서 생성 성공');
    return response;
  } catch (error) {
    console.error('❌ Electron 프로젝트 보고서 생성 실패:', error);
    return {
      success: false,
      error: `Electron API 오류: ${error.message}`,
      rawResponse: error
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

const MOCK_API_CALLS = true; // LLM API 호출을 모킹하려면 true로 설정

const mockScrumData = {
  sprint_title: "Sprint 1: The Foundation",
  sprint_duration: "1 week (2025-07-15 ~ 2025-07-22)",
  sprint_goals: [
    {
      title: "User Authentication Setup",
      description: "Implement user login, registration, and session management.",
      priority: "HIGH",
      estimated_hours: 16,
      assignee: "Backend Team",
      acceptance_criteria: [
        "Users can register with a unique username and password.",
        "Users can log in with correct credentials.",
        "A session token is generated upon successful login."
      ]
    },
    {
      title: "Initial UI/UX Mockup Design",
      description: "Create wireframes and mockups for the main application pages.",
      priority: "MEDIUM",
      estimated_hours: 24,
      assignee: "Design Team",
      acceptance_criteria: [
        "Wireframes for Dashboard, Settings, and Profile pages are complete.",
        "High-fidelity mockups are approved by the product owner."
      ]
    }
  ],
  team_notes: [
    "The backend database schema needs to be finalized by Wednesday.",
    "Marketing team requires initial screenshots for the upcoming presentation."
  ],
  risks_and_blockers: [
    "The new UI library has a steep learning curve which might delay frontend development.",
    "API endpoint specifications are still pending from the external partner."
  ],
  next_actions: [
    "Finalize the database schema and share with the team.",
    "Schedule a follow-up meeting with the external partner regarding API specs."
  ]
};


export const generateScrumPage = async (scrumData) => {
  if (MOCK_API_CALLS) {
    console.warn('🚧 LLM API 호출이 모킹되었습니다. 실제 API를 호출하지 않습니다.');
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          success: true,
          scrumPage: mockScrumData,
          rawResponse: "Mocked response"
        });
      }, 1500); // 1.5초 지연을 시뮬레이션
    });
  }
  
  if (!isElectron) {
    return {
      success: false,
      error: 'Electron 환경에서만 사용할 수 있습니다.',
      rawResponse: null
    };
  }

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