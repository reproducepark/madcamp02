import React, { useState } from 'react';
import {
  handleLLMError,
  generateProjectReport
} from '../services/llmService';

const LLMExample = () => {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 더미 프로젝트 데이터
  const dummyProjectData = {
    "project_title": "사내 인트라넷 시스템 고도화",
    "team_checklist": {
      "completed": [
        "1단계: 로그인 SSO 연동",
        "2단계: 게시판 UI/UX 개편",
        "3단계: 파일 업로드/다운로드 속도 개선"
      ],
      "incomplete": []
    },
    "member_checklists": [
      {
        "completed": ["프로젝트 계획 수립", "1, 2, 3단계 완료 보고"],
        "incomplete": []
      }
    ],
    "inquiries": []
  };

  // 프로젝트 보고서 생성
  const handleProjectReportGeneration = async () => {
    setLoading(true);
    setError('');
    setResponse('');

    try {
      const result = await generateProjectReport(dummyProjectData);

      if (result.success) {
        setResponse(result.report);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(handleLLMError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>프로젝트 보고서 생성</h2>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button
          onClick={handleProjectReportGeneration}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '생성 중...' : '프로젝트 보고서 생성'}
        </button>
      </div>

      {error && (
        <div style={{
          padding: '10px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <strong>오류:</strong> {error}
        </div>
      )}

      {response && (
        <div style={{ marginBottom: '20px' }}>
          <h3>생성된 보고서:</h3>
          <div style={{
            padding: '15px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            whiteSpace: 'pre-wrap'
          }}>
            {response}
          </div>
        </div>
      )}

      <div style={{
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '4px'
      }}>
        <h4>사용법:</h4>
        <ul>
          <li><strong>프로젝트 보고서 생성:</strong> 더미 데이터를 사용하여 프로젝트 진행 상황 보고서 생성</li>
        </ul>
        
        <h4>더미 프로젝트 데이터:</h4>
        <pre style={{
          backgroundColor: '#e9ecef',
          padding: '10px',
          borderRadius: '4px',
          fontSize: '12px',
          overflow: 'auto'
        }}>
          {JSON.stringify(dummyProjectData, null, 2)}
        </pre>
        
        <h4>환경 변수 설정:</h4>
        <p>
          <code>VITE_GEMINI_API_KEY=your_api_key_here</code>를 프로젝트 루트의 <code>.env</code> 파일에 설정하세요.
        </p>
      </div>
    </div>
  );
};

export default LLMExample; 