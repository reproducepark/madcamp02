import React from "react";

// 재사용 가능한 GoalSection 컴포넌트 (이전과 동일)
function GoalSection({ title, items }) {
  return (
    <div className="w-full mb-3">
      <div className="flex items-center font-semibold text-base mb-1">
        {title}
        <button className="ml-2 text-lg border-none bg-transparent cursor-pointer text-gray-400">
          +
        </button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="flex items-center mb-1">
          <input type="checkbox" className="mr-2" />
          <span className="text-gray-700 text-sm">{item}</span>
        </div>
      ))}
    </div>
  );
}

// 투두리스트 사이드바 컴포넌트 (이름 변경)
function TodoListSidebar() { // RightSidebar -> TodoListSidebar로 이름 변경
  const goals = [
    {
      title: "목표1",
      items: ["콘티짜기", "아이디어 회의", "자료 조사", "스토리보드 작성"],
    },
    {
      title: "목표2",
      items: ["코드 작성", "버그 수정"],
    },
  ];

  const currentDate = new Date();
  const formattedDate = `${currentDate.getFullYear()}. ${
    currentDate.getMonth() + 1
  }. ${currentDate.getDate()}.`;

  return (
    <div className="w-80 bg-white border-l border-gray-300 flex flex-col items-start pt-8 px-6 flex-shrink-0">
      <div className="w-full text-right text-xl font-semibold text-gray-800 border-b-2 border-gray-400 pb-2 mb-5">
        {formattedDate}
      </div>
      {goals.map((goal, index) => (
        <GoalSection key={index} title={goal.title} items={goal.items} />
      ))}
      <div className="w-full my-4">
        <div className="font-semibold text-base mb-1">메모</div>
        <textarea
          className="w-full min-h-[40px] border border-gray-400 rounded p-2 text-sm resize-y"
          placeholder="메모를 입력하세요"
        />
      </div>
      <div className="w-full flex gap-2 mt-4">
        <button className="flex-1 bg-gray-300 text-gray-700 text-lg border-none rounded py-4 cursor-pointer">
          할일 추가
        </button>
        <button className="flex-1 bg-gray-300 text-gray-700 text-lg border-none rounded py-4 cursor-pointer">
          등록
        </button>
      </div>
    </div>
  );
}

// 메인 FirstPage 컴포넌트
function FirstPage() {
  const handleMenuItemClick = (menuName) => {
    console.log(`${menuName} 메뉴가 클릭되었습니다.`);
  };

  return (
    <div className="bg-gray-900 h-screen p-0 m-0">
      {/* 전체 페이지를 감싸는 컨테이너. 내부 요소를 양쪽 끝으로 정렬하기 위해 flex와 justify-between 사용 */}
      <div className="w-full bg-white h-full flex flex-row justify-between box-border border-8 border-white">
        {/* 왼쪽 메뉴 */}
        <div className="w-36 min-w-[120px] bg-gray-200 flex flex-col items-center justify-center pt-10 text-lg text-gray-700">
          <ul className="list-none p-0 m-0 text-center">
            <li
              className="mb-10 leading-tight cursor-pointer"
              onClick={() => handleMenuItemClick("스트레칭 및 타이머")}
            >
              스트레칭
              <br />
              및
              <br />
              타이머
            </li>
            <li
              className="mb-10 cursor-pointer"
              onClick={() => handleMenuItemClick("나의 투두리스트")}
            >
              나의 투두리스트
            </li>
            <li
              className="cursor-pointer"
              onClick={() => handleMenuItemClick("팀즈")}
            >
              팀즈
            </li>
          </ul>
        </div>

        {/* 중앙 비어있는 영역 */}
        <div className="flex-grow" />

        {/* 투두리스트 사이드바 */}
        <TodoListSidebar /> {/* RightSidebar -> TodoListSidebar로 변경 */}
      </div>
    </div>
  );
}

export default FirstPage;