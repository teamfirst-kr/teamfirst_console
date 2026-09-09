// 솔루션 상세 팝업 콘텐츠 (iframe srcDoc으로 격리 렌더링되는 독립 HTML 문서).
// CatchLog / AUTO REPORT / AUTO BID: 사용자 제공 상세 페이지 원문.
// 공통 수정: 내부 CTA를 /apply(페이백 신청)로 연결, CatchLog는 가입/무료체험
// 단계를 페이백 온보딩 문맥으로 치환 (페이백 고객에게 솔루션은 무료 제공).

// ── CatchLog (로그분석 프로그램) — 제공 원문 ──────────────────────────
const CATCHLOG_HTML = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CatchLog 상세 소개</title>
</head>
<body style="margin:0;background:#0B1526;min-height:100vh;display:flex;align-items:flex-start;justify-content:center;padding:4vh 16px;font-family:Pretendard,'Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',sans-serif">

<style>
  .clp-panel, .clp-panel *{ box-sizing:border-box; margin:0; padding:0; }
  .clp-panel{
    width:100%; max-width:760px; background:#0D1830; color:#E8EEF7;
    border:1px solid rgba(120,160,220,.16); border-radius:18px;
    box-shadow:0 24px 80px rgba(0,0,0,.55); overflow:hidden;
    font-family:Pretendard,'Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',sans-serif;
    line-height:1.7;
  }
  .clp-head{ padding:34px 36px 26px; background:radial-gradient(90% 140% at 85% -20%, rgba(41,182,255,.16), transparent 55%), #0E1B33; border-bottom:1px solid rgba(120,160,220,.12); }
  .clp-badge{ display:inline-block; background:#1D4ED8; color:#fff; font-size:12px; font-weight:700; letter-spacing:.06em; border-radius:999px; padding:4px 12px; margin-bottom:14px; }
  .clp-head h2{ font-size:26px; font-weight:800; letter-spacing:-.01em; }
  .clp-head h2 b{ color:#4FC7FF; }
  .clp-head p{ margin-top:10px; color:#9DB0C9; font-size:14.5px; max-width:56ch; }
  .clp-chips{ display:flex; gap:8px; margin-top:14px; flex-wrap:wrap; }
  .clp-chip{ font-size:12px; font-weight:700; color:#4FC7FF; background:rgba(41,182,255,.10); border:1px solid rgba(41,182,255,.35); border-radius:999px; padding:4px 12px; }

  .clp-body{ padding:28px 36px 34px; }
  .clp-sec{ margin-bottom:30px; }
  .clp-sec-t{ display:flex; align-items:center; gap:8px; font-size:13px; font-weight:800; letter-spacing:.08em; color:#4FC7FF; margin-bottom:14px; }
  .clp-sec-t::after{ content:""; flex:1; height:1px; background:rgba(120,160,220,.14); }

  .clp-grid{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .clp-card{ background:#141F37; border:1px solid rgba(120,160,220,.12); border-radius:12px; padding:16px 18px; }
  .clp-card h4{ font-size:14.5px; font-weight:700; margin-bottom:6px; }
  .clp-card h4 span{ margin-right:6px; }
  .clp-card p{ font-size:13px; color:#9DB0C9; }
  .clp-card p b{ color:#C9DCF5; font-weight:600; }

  .clp-step{ display:flex; gap:14px; padding:13px 0; border-bottom:1px dashed rgba(120,160,220,.12); }
  .clp-step:last-child{ border-bottom:none; }
  .clp-step-n{ flex-shrink:0; width:30px; height:30px; border-radius:9px; background:rgba(41,182,255,.14); color:#4FC7FF; font-weight:800; font-size:14px; display:flex; align-items:center; justify-content:center; }
  .clp-step h4{ font-size:14.5px; font-weight:700; margin-bottom:3px; }
  .clp-step p{ font-size:13px; color:#9DB0C9; }
  .clp-step b{ color:#C9DCF5; font-weight:600; }

  .clp-fx{ display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
  .clp-fx-card{ background:linear-gradient(180deg,#152442,#121D35); border:1px solid rgba(41,182,255,.22); border-radius:12px; padding:18px 16px; text-align:center; }
  .clp-fx-card .v{ font-size:21px; font-weight:800; color:#4FC7FF; margin-bottom:4px; }
  .clp-fx-card .l{ font-size:12.5px; color:#9DB0C9; line-height:1.55; }

  .clp-cta-wrap{ margin-top:4px; text-align:center; background:#141F37; border:1px solid rgba(120,160,220,.12); border-radius:14px; padding:22px 20px; }
  .clp-cta-wrap p{ font-size:13.5px; color:#9DB0C9; margin-bottom:12px; }
  .clp-cta{ display:inline-block; background:#1BA9F5; color:#04101F; font-weight:800; font-size:15px; text-decoration:none; border-radius:10px; padding:13px 34px; transition:filter .15s; }
  .clp-cta:hover{ filter:brightness(1.12); }

  @media (max-width:640px){
    .clp-head{ padding:26px 22px 20px; } .clp-body{ padding:22px 20px 26px; }
    .clp-grid{ grid-template-columns:1fr; } .clp-fx{ grid-template-columns:1fr; }
    .clp-head h2{ font-size:21px; }
  }
</style>

<div class="clp-panel">

  <div class="clp-head">
    <span class="clp-badge">CATCHLOG</span>
    <h2>광고비 누수,<br>숫자로 <b>진단</b>합니다</h2>
    <p>방문부터 광고 클릭·부정클릭·전환·매출까지, 봇 트래픽을 제외한 실방문 기준으로 집계하는
    광고 성과 분석 솔루션입니다. 어디서 광고비가 새는지 숫자로 짚어드립니다.</p>
    <div class="clp-chips">
      <span class="clp-chip">실시간 방문 분석</span>
      <span class="clp-chip">부정클릭 방지</span>
      <span class="clp-chip">네이버 광고 연동</span>
      <span class="clp-chip">전환·매출 추적</span>
    </div>
  </div>

  <div class="clp-body">

    <div class="clp-sec">
      <div class="clp-sec-t">상세 기능</div>
      <div class="clp-grid">
        <div class="clp-card">
          <h4><span>👁</span>실시간 방문 분석</h4>
          <p>지금 이 순간 사이트에 접속 중인 방문자까지 실시간으로 확인합니다. <b>유입 경로와 행동</b>을 광고 관리 화면을 오가지 않고 바로 파악합니다.</p>
        </div>
        <div class="clp-card">
          <h4><span>🛡</span>부정클릭 자동 판정·차단</h4>
          <p>유효·무효·의심 <b>3단계로 클릭을 자동 판정</b>하고, 환급 신청에 쓸 수 있도록 IP·시각·패턴 근거를 남깁니다. 의심 IP는 네이버 광고노출제한에 바로 연동됩니다.</p>
        </div>
        <div class="clp-card">
          <h4><span>📊</span>네이버 광고 전 지면 성과</h4>
          <p>파워링크·쇼핑검색·브랜드검색까지 <b>캠페인·키워드별 광고비 대비 성과</b>를 한 화면에 모읍니다. 흩어져 보던 성과를 한 곳에서 비교합니다.</p>
        </div>
        <div class="clp-card">
          <h4><span>💳</span>전환·매출 추적</h4>
          <p>클릭이 아니라 <b>주문·결제 기준</b>으로 광고 성과를 평가합니다. 스마트스토어처럼 스크립트가 안 되는 채널은 추적 URL로 집계합니다.</p>
        </div>
        <div class="clp-card">
          <h4><span>🖱</span>히트맵·행동 분석</h4>
          <p>방문자의 <b>클릭과 스크롤 흐름</b>을 한눈에 보여줘, 광고를 타고 들어온 뒤 어디서 이탈하는지 짚어냅니다.</p>
        </div>
        <div class="clp-card">
          <h4><span>👥</span>광고주 다중 관리</h4>
          <p>다수 광고주를 <b>단일 콘솔</b>에서 관리합니다. 광고주에게는 자기 사이트만 보이는 전용 콘솔을 발급해 직접 열람하게 할 수 있습니다.</p>
        </div>
      </div>
    </div>

    <div class="clp-sec">
      <div class="clp-sec-t">실행 로직</div>
      <div>
        <div class="clp-step">
          <div class="clp-step-n">1</div>
          <div><h4>페이백 신청</h4>
          <p>팀퍼스트 페이백을 신청하고 대행권 지정·활성화가 완료되면 <b>솔루션 계정이 무료로 발급</b>됩니다. 별도 결제가 없습니다.</p></div>
        </div>
        <div class="clp-step">
          <div class="clp-step-n">2</div>
          <div><h4>설치</h4>
          <p>자사몰은 <b>스크립트 한 줄</b>을 &lt;head&gt;에 붙이면 끝입니다. 스마트스토어·카카오채널 등 스크립트가 안 되는 채널은 <b>추적 URL</b>로 등록합니다. 설치가 부담스러우면 운영팀이 대신 설치해 드립니다.</p></div>
        </div>
        <div class="clp-step">
          <div class="clp-step-n">3</div>
          <div><h4>광고 연동</h4>
          <p><b>네이버 검색광고 API</b> 자격증명을 등록하면 캠페인·광고그룹·키워드·광고비·검색어 데이터가 매일 자동으로 수집됩니다.</p></div>
        </div>
        <div class="clp-step">
          <div class="clp-step-n">4</div>
          <div><h4>분석 시작</h4>
          <p>설치 직후부터 수집이 시작돼 <b>5분 단위</b>로 대시보드에 반영됩니다. 진단·리포트는 메일로도 자동 발송됩니다.</p></div>
        </div>
      </div>
    </div>

    <div class="clp-sec">
      <div class="clp-sec-t">도입 효과</div>
      <div class="clp-fx">
        <div class="clp-fx-card">
          <div class="v">월 200만+</div>
          <div class="l">분석하는 페이지뷰<br>최근 30일 실측 기준</div>
        </div>
        <div class="clp-fx-card">
          <div class="v">80만+</div>
          <div class="l">검증한 광고 클릭<br>누적 데이터</div>
        </div>
        <div class="clp-fx-card">
          <div class="v">14만+</div>
          <div class="l">탐지한 무효·의심<br>클릭</div>
        </div>
      </div>
    </div>

    <div class="clp-cta-wrap">
      <p>봇을 제외한 실방문 기준으로, 광고비가 새는 지점을 숫자로 짚어드립니다.</p>
      <a class="clp-cta" href="#" onclick="event.preventDefault();parent.postMessage({type:'tf-open-apply'},'*')">페이백 신청하고 무료로 이용하기</a>
    </div>

  </div>
</div>

</body>
</html>`;

// ── AUTO REPORT (자동리포트) — 제공 원문 ──────────────────────────────
const AUTO_REPORT_HTML = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AUTO REPORT 상세 소개</title>
</head>
<body style="margin:0;background:#0B1526;min-height:100vh;display:flex;align-items:flex-start;justify-content:center;padding:4vh 16px;font-family:Pretendard,'Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',sans-serif">

<style>
  .arp-panel, .arp-panel *{ box-sizing:border-box; margin:0; padding:0; }
  .arp-panel{
    width:100%; max-width:760px; background:#0D1830; color:#E8EEF7;
    border:1px solid rgba(120,160,220,.16); border-radius:18px;
    box-shadow:0 24px 80px rgba(0,0,0,.55); overflow:hidden;
    font-family:Pretendard,'Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',sans-serif;
    line-height:1.7;
  }
  .arp-head{ padding:34px 36px 26px; background:radial-gradient(90% 140% at 85% -20%, rgba(41,182,255,.16), transparent 55%), #0E1B33; border-bottom:1px solid rgba(120,160,220,.12); }
  .arp-badge{ display:inline-block; background:#1D4ED8; color:#fff; font-size:12px; font-weight:700; letter-spacing:.06em; border-radius:999px; padding:4px 12px; margin-bottom:14px; }
  .arp-head h2{ font-size:26px; font-weight:800; letter-spacing:-.01em; }
  .arp-head h2 b{ color:#4FC7FF; }
  .arp-head p{ margin-top:10px; color:#9DB0C9; font-size:14.5px; max-width:56ch; }

  .arp-body{ padding:28px 36px 34px; }
  .arp-sec{ margin-bottom:30px; }
  .arp-sec-t{ display:flex; align-items:center; gap:8px; font-size:13px; font-weight:800; letter-spacing:.08em; color:#4FC7FF; margin-bottom:14px; }
  .arp-sec-t::after{ content:""; flex:1; height:1px; background:rgba(120,160,220,.14); }

  .arp-grid{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .arp-card{ background:#141F37; border:1px solid rgba(120,160,220,.12); border-radius:12px; padding:16px 18px; }
  .arp-card h4{ font-size:14.5px; font-weight:700; margin-bottom:6px; }
  .arp-card h4 span{ margin-right:6px; }
  .arp-card p{ font-size:13px; color:#9DB0C9; }

  .arp-step{ display:flex; gap:14px; padding:13px 0; border-bottom:1px dashed rgba(120,160,220,.12); }
  .arp-step:last-child{ border-bottom:none; }
  .arp-step-n{ flex-shrink:0; width:30px; height:30px; border-radius:9px; background:rgba(41,182,255,.14); color:#4FC7FF; font-weight:800; font-size:14px; display:flex; align-items:center; justify-content:center; }
  .arp-step h4{ font-size:14.5px; font-weight:700; margin-bottom:3px; }
  .arp-step p{ font-size:13px; color:#9DB0C9; }
  .arp-step b{ color:#C9DCF5; font-weight:600; }

  .arp-fx{ display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
  .arp-fx-card{ background:linear-gradient(180deg,#152442,#121D35); border:1px solid rgba(41,182,255,.22); border-radius:12px; padding:18px 16px; text-align:center; }
  .arp-fx-card .v{ font-size:21px; font-weight:800; color:#4FC7FF; margin-bottom:4px; }
  .arp-fx-card .l{ font-size:12.5px; color:#9DB0C9; line-height:1.55; }

  .arp-cta-wrap{ margin-top:4px; text-align:center; background:#141F37; border:1px solid rgba(120,160,220,.12); border-radius:14px; padding:22px 20px; }
  .arp-cta-wrap p{ font-size:13.5px; color:#9DB0C9; margin-bottom:12px; }
  .arp-cta{ display:inline-block; background:#1BA9F5; color:#04101F; font-weight:800; font-size:15px; text-decoration:none; border-radius:10px; padding:13px 34px; transition:filter .15s; }
  .arp-cta:hover{ filter:brightness(1.12); }

  @media (max-width:640px){
    .arp-head{ padding:26px 22px 20px; } .arp-body{ padding:22px 20px 26px; }
    .arp-grid{ grid-template-columns:1fr; } .arp-fx{ grid-template-columns:1fr; }
    .arp-head h2{ font-size:21px; }
  }
</style>

<div class="arp-panel">

  <div class="arp-head">
    <span class="arp-badge">AUTO REPORT</span>
    <h2>네이버 검색광고 리포트,<br>만들지 말고 <b>받아보세요</b></h2>
    <p>네이버 공식 API로 성과 데이터를 매일 자동 수집해 대시보드로 확인하고, 정해둔 스케줄에
    광고주·담당자 메일함으로 엑셀 리포트를 누락 없이 발송하는 자동 리포트 솔루션입니다.</p>
  </div>

  <div class="arp-body">

    <div class="arp-sec">
      <div class="arp-sec-t">상세 기능</div>
      <div class="arp-grid">
        <div class="arp-card">
          <h4><span>📊</span>자주 보는 데이터, 대시보드로 한눈에</h4>
          <p>캠페인·광고그룹·키워드·기기·시간대별 성과를 매번 광고시스템을 뒤지지 않고 대시보드 한 화면에서 바로 확인합니다.</p>
        </div>
        <div class="arp-card">
          <h4><span>🎯</span>증액·감액 판단 데이터 체크</h4>
          <p>광고비를 늘릴지 줄일지 결정해야 할 때, 조정 근거가 되는 성과 데이터를 한눈에 모아 보여줍니다. 증액·감액 제안까지 함께 확인할 수 있습니다.</p>
        </div>
        <div class="arp-card">
          <h4><span>📅</span>일 · 주 · 월 단위 리포트</h4>
          <p>일간·주간·월간 리포트가 자동 생성되고, 전일·전주·전월 대비 기간별 비교가 포함돼 좋아진 것과 나빠진 것이 바로 보입니다.</p>
        </div>
        <div class="arp-card">
          <h4><span>🗓</span>기간 선택 리포트</h4>
          <p>정기 리포트 외에도 원하는 기간을 직접 지정해 리포트를 만들 수 있습니다. 비교 기간까지 지정하면 두 기간을 나란히 분석합니다.</p>
        </div>
        <div class="arp-card">
          <h4><span>🧩</span>맞춤 리포트 (커스텀 시트)</h4>
          <p>네이버 다차원보고서처럼 차원(캠페인·키워드·기기·시간대 등)과 지표(노출·클릭·비용·총/직접/간접 전환 등)를 자유롭게 조합해 나만의 시트를 구성합니다.</p>
        </div>
        <div class="arp-card">
          <h4><span>📮</span>누락 없는 스케줄 발송</h4>
          <p>계정마다 원하는 발송 스케줄(예: 매주 월요일 09시)을 정하면 그대로 발송됩니다. 실패하면 자동 재시도하고, 모든 발송 이력이 기록돼 빠지는 리포트가 없습니다.</p>
        </div>
      </div>
    </div>

    <div class="arp-sec">
      <div class="arp-sec-t">실행 로직</div>
      <div>
        <div class="arp-step">
          <div class="arp-step-n">1</div>
          <div><h4>네이버 공식 API 연동</h4>
          <p>광고 계정을 <b>네이버 검색광고 공식 API</b>로 연결합니다. 별도 프로그램 설치나 광고시스템 로그인 공유가 필요 없습니다.</p></div>
        </div>
        <div class="arp-step">
          <div class="arp-step-n">2</div>
          <div><h4>성과 데이터 자동 수집</h4>
          <p>매일 캠페인·광고그룹·키워드·기기·시간대별 성과와 전환 데이터를 수집해 대시보드에 반영합니다. 수치는 <b>네이버 보고서와 일치하도록 교차 검증</b>을 거칩니다.</p></div>
        </div>
        <div class="arp-step">
          <div class="arp-step-n">3</div>
          <div><h4>리포트 자동 생성</h4>
          <p>예약된 스케줄에 요약·기간비교·상세 분석 시트로 구성된 <b>엑셀 리포트</b>를 자동 생성합니다. 시트 구성은 광고주마다 다르게 설정할 수 있고, 원하는 기간을 지정한 리포트도 즉시 만들 수 있습니다.</p></div>
        </div>
        <div class="arp-step">
          <div class="arp-step-n">4</div>
          <div><h4>메일 발송 + 자동 재시도</h4>
          <p>광고주와 담당자 메일로 자동 발송합니다. 일시적 오류로 발송이 밀리면 <b>시스템이 스스로 따라잡아 재발송</b>하고, 성공·실패 이력이 전부 남아 누락 없이 관리됩니다.</p></div>
        </div>
      </div>
    </div>

    <div class="arp-sec">
      <div class="arp-sec-t">도입 효과</div>
      <div class="arp-fx">
        <div class="arp-fx-card">
          <div class="v">주 5시간+</div>
          <div class="l">광고주 10곳 기준<br>리포트 수작업 시간 절감</div>
        </div>
        <div class="arp-fx-card">
          <div class="v">누락 0</div>
          <div class="l">자동 재시도·발송 이력으로<br>빠뜨리는 리포트 없이</div>
        </div>
        <div class="arp-fx-card">
          <div class="v">데이터 신뢰</div>
          <div class="l">네이버 보고서와 일치하는<br>검증된 수치만 발송</div>
        </div>
      </div>
    </div>

    <div class="arp-cta-wrap">
      <p>매번 엑셀과 씨름하던 리포트 업무, 이제 자동으로 도착합니다.</p>
      <a class="arp-cta" href="#" onclick="event.preventDefault();parent.postMessage({type:'tf-open-apply'},'*')">페이백 신청하고 무료로 이용하기</a>
    </div>

  </div>
</div>

</body>
</html>`;

// ── AUTO BID (성과최적화 입찰조정) — 제공 원문 ────────────────────────
const AUTO_BID_HTML = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AUTO BID 상세 소개</title>
</head>
<body style="margin:0;background:#0B1526;min-height:100vh;display:flex;align-items:flex-start;justify-content:center;padding:4vh 16px;font-family:Pretendard,'Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',sans-serif">

<style>
  .abp-panel, .abp-panel *{ box-sizing:border-box; margin:0; padding:0; }
  .abp-panel{
    width:100%; max-width:760px; background:#0D1830; color:#E8EEF7;
    border:1px solid rgba(120,160,220,.16); border-radius:18px;
    box-shadow:0 24px 80px rgba(0,0,0,.55); overflow:hidden;
    font-family:Pretendard,'Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',sans-serif;
    line-height:1.7;
  }
  .abp-head{ padding:34px 36px 26px; background:radial-gradient(90% 140% at 85% -20%, rgba(41,182,255,.16), transparent 55%), #0E1B33; border-bottom:1px solid rgba(120,160,220,.12); }
  .abp-badge{ display:inline-block; background:#1D4ED8; color:#fff; font-size:12px; font-weight:700; letter-spacing:.06em; border-radius:999px; padding:4px 12px; margin-bottom:14px; }
  .abp-head h2{ font-size:26px; font-weight:800; letter-spacing:-.01em; }
  .abp-head h2 b{ color:#4FC7FF; }
  .abp-head p{ margin-top:10px; color:#9DB0C9; font-size:14.5px; max-width:56ch; }
  .abp-chips{ display:flex; gap:8px; margin-top:14px; flex-wrap:wrap; }
  .abp-chip{ font-size:12px; font-weight:700; color:#4FC7FF; background:rgba(41,182,255,.10); border:1px solid rgba(41,182,255,.35); border-radius:999px; padding:4px 12px; }

  .abp-body{ padding:28px 36px 34px; }
  .abp-sec{ margin-bottom:30px; }
  .abp-sec-t{ display:flex; align-items:center; gap:8px; font-size:13px; font-weight:800; letter-spacing:.08em; color:#4FC7FF; margin-bottom:14px; }
  .abp-sec-t::after{ content:""; flex:1; height:1px; background:rgba(120,160,220,.14); }

  .abp-grid{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .abp-card{ background:#141F37; border:1px solid rgba(120,160,220,.12); border-radius:12px; padding:16px 18px; }
  .abp-card h4{ font-size:14.5px; font-weight:700; margin-bottom:6px; }
  .abp-card h4 span{ margin-right:6px; }
  .abp-card p{ font-size:13px; color:#9DB0C9; }

  .abp-step{ display:flex; gap:14px; padding:13px 0; border-bottom:1px dashed rgba(120,160,220,.12); }
  .abp-step:last-child{ border-bottom:none; }
  .abp-step-n{ flex-shrink:0; width:30px; height:30px; border-radius:9px; background:rgba(41,182,255,.14); color:#4FC7FF; font-weight:800; font-size:14px; display:flex; align-items:center; justify-content:center; }
  .abp-step h4{ font-size:14.5px; font-weight:700; margin-bottom:3px; }
  .abp-step p{ font-size:13px; color:#9DB0C9; }
  .abp-step b{ color:#C9DCF5; font-weight:600; }

  .abp-fx{ display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
  .abp-fx-card{ background:linear-gradient(180deg,#152442,#121D35); border:1px solid rgba(41,182,255,.22); border-radius:12px; padding:18px 16px; text-align:center; }
  .abp-fx-card .v{ font-size:21px; font-weight:800; color:#4FC7FF; margin-bottom:4px; }
  .abp-fx-card .l{ font-size:12.5px; color:#9DB0C9; line-height:1.55; }

  .abp-cta-wrap{ margin-top:4px; text-align:center; background:#141F37; border:1px solid rgba(120,160,220,.12); border-radius:14px; padding:22px 20px; }
  .abp-cta-wrap p{ font-size:13.5px; color:#9DB0C9; margin-bottom:12px; }
  .abp-cta{ display:inline-block; background:#1BA9F5; color:#04101F; font-weight:800; font-size:15px; text-decoration:none; border-radius:10px; padding:13px 34px; transition:filter .15s; }
  .abp-cta:hover{ filter:brightness(1.12); }

  @media (max-width:640px){
    .abp-head{ padding:26px 22px 20px; } .abp-body{ padding:22px 20px 26px; }
    .abp-grid{ grid-template-columns:1fr; } .abp-fx{ grid-template-columns:1fr; }
    .abp-head h2{ font-size:21px; }
  }
</style>

<div class="abp-panel">

  <div class="abp-head">
    <span class="abp-badge">AUTO BID</span>
    <h2>목표 ROAS만 정해두면,<br>입찰 조정은 <b>매주 자동으로</b></h2>
    <p>파워링크 키워드와 쇼핑검색 소재의 입찰가를 목표 성과 기준으로 매주 자동 분석·조정하는
    성과최적화 입찰 솔루션입니다. 캠페인 뭉뚱그림이 아니라 소재·키워드 하나하나를 봅니다.</p>
    <div class="abp-chips">
      <span class="abp-chip">파워링크</span>
      <span class="abp-chip">쇼핑검색</span>
      <span class="abp-chip">소재/키워드 단위</span>
      <span class="abp-chip">주간 자동화</span>
    </div>
  </div>

  <div class="abp-body">

    <div class="abp-sec">
      <div class="abp-sec-t">상세 기능</div>
      <div class="abp-grid">
        <div class="abp-card">
          <h4><span>🔍</span>소재 · 키워드 단위 정밀 조정</h4>
          <p>캠페인 단위 평균이 아니라 <b>쇼핑검색은 소재별, 파워링크는 키워드별</b>로 성과를 판정하고 입찰가를 각각 조정합니다. 잘하는 소재와 못하는 소재가 섞여 묻히지 않습니다.</p>
        </div>
        <div class="abp-card">
          <h4><span>📈</span>주차별 성과 추이 한눈에</h4>
          <p>소재·키워드마다 주차별 비용·매출·ROAS·입찰가 변화가 옆으로 쌓이는 표로 정리됩니다. 몇 주에 걸친 성과 흐름과 조정 효과를 한 화면에서 비교합니다.</p>
        </div>
        <div class="abp-card">
          <h4><span>🛡</span>매출볼륨 보호</h4>
          <p>ROAS만 좇다가 매출볼륨이 죽는 상황을 막습니다. 감액 판정이라도 <b>최근 매출이 기준보다 급감한 소재는 자동 감액을 보류</b>하고 승인 대기로 돌립니다.</p>
        </div>
        <div class="abp-card">
          <h4><span>🏷</span>상품 성격별 차등 규칙</h4>
          <p>집중홍보·신제품·비주력 등 상품 구분에 따라 <b>목표 보정치와 상향·하향 조정 폭을 각각 다르게</b> 설정합니다. 신제품은 감액 금지, 비주력은 과감히 축소 같은 운영이 가능합니다.</p>
        </div>
        <div class="abp-card">
          <h4><span>⚙️</span>목표 기준 주간 자동화</h4>
          <p>목표 ROAS만 설정해두면, <b>얼마나 초과하면 상향하고 얼마나 미달하면 하향할지</b> 정해둔 기준에 따라 매주 자동으로 분석·조정합니다.</p>
        </div>
        <div class="abp-card">
          <h4><span>🧾</span>모든 조정 내역 한눈에</h4>
          <p>언제 어떤 소재의 입찰가가 얼마에서 얼마로, 어떤 근거로 바뀌었는지 <b>변경 전→후 이력이 전부 기록</b>됩니다. 큰 폭의 변경은 자동이라도 반드시 승인을 거칩니다.</p>
        </div>
      </div>
    </div>

    <div class="abp-sec">
      <div class="abp-sec-t">실행 로직</div>
      <div>
        <div class="abp-step">
          <div class="abp-step-n">1</div>
          <div><h4>목표와 규칙 설정</h4>
          <p><b>목표 ROAS</b>와 허용 범위(얼마나 초과하면 상향, 얼마나 미달하면 하향), 그리고 집중홍보·신제품·비주력 등 <b>상품 분류별 차등 규칙</b>을 설정합니다. 이후는 시스템이 알아서 돌아갑니다.</p></div>
        </div>
        <div class="abp-step">
          <div class="abp-step-n">2</div>
          <div><h4>주간 성과 자동 수집</h4>
          <p>매주 소재·키워드별 최근 4주 성과를 수집하고, <b>최근 주에 가중치를 둔 블렌딩 ROAS</b>를 산출합니다. 일시적 등락에 흔들리지 않는 판정 기준이 됩니다.</p></div>
        </div>
        <div class="abp-step">
          <div class="abp-step-n">3</div>
          <div><h4>자동 판정 — 상향 / 하향 / 유지 / 보류</h4>
          <p>분류별 보정을 반영한 목표 대비 초과면 상향, 미달이면 하향, 허용 범위 안이면 유지합니다. 단 <b>매출볼륨이 급감한 소재는 감액을 보류</b>해 볼륨을 지킵니다.</p></div>
        </div>
        <div class="abp-step">
          <div class="abp-step-n">4</div>
          <div><h4>적용과 기록</h4>
          <p>산출된 권장 입찰가를 자동 적용하거나 승인 후 일괄 반영합니다. 적용 전 현재 입찰가를 재검증하고, <b>모든 변경이 이력으로 남아</b> 언제든 추적할 수 있습니다.</p></div>
        </div>
      </div>
    </div>

    <div class="abp-sec">
      <div class="abp-sec-t">도입 효과</div>
      <div class="abp-fx">
        <div class="abp-fx-card">
          <div class="v">매주 자동</div>
          <div class="l">소재별 입찰 조정 루틴을<br>사람 손 없이 반복</div>
        </div>
        <div class="abp-fx-card">
          <div class="v">ROAS + 볼륨</div>
          <div class="l">수익률과 매출볼륨을<br>동시에 방어하는 판정</div>
        </div>
        <div class="abp-fx-card">
          <div class="v">소재 단위</div>
          <div class="l">캠페인 평균에 묻히던<br>개별 소재까지 정밀 최적화</div>
        </div>
      </div>
    </div>

    <div class="abp-cta-wrap">
      <p>목표만 정해두세요. 분석부터 조정·기록까지, 입찰 관리가 한 번에 돌아갑니다.</p>
      <a class="abp-cta" href="#" onclick="event.preventDefault();parent.postMessage({type:'tf-open-apply'},'*')">페이백 신청하고 무료로 이용하기</a>
    </div>

  </div>
</div>

</body>
</html>`;

export const SOLUTION_DETAILS: Record<string, string> = {
  log: CATCHLOG_HTML,
  report: AUTO_REPORT_HTML,
  bid: AUTO_BID_HTML,
};
