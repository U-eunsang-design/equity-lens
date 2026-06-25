import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `당신은 기업 심층 분석(Equity Research) 전문가입니다.

개별 상장 기업을 투자 판단 관점에서 아래 9개 항목을 빠짐없이 채워 분석합니다.

## 핵심 원칙
1. 9개 항목을 항상 채운다. 확인 안 된 수치는 "확인 불가"로 표기.
2. 수치에는 출처와 시점을 명시한다.
3. 긍정·부정 양쪽을 모두 본다. 한쪽으로 치우친 분석 금지.
4. 마지막엔 투자의견을 서술한다.

## 분석 항목 (반드시 아래 마크다운 형식 그대로 출력)

### ① 시가총액 · 밸류에이션
- 시가총액, 현재가, 52주 범위
- PER (EPS·계산식 명시), PBR, ROE, 선행 PER
- 영업이익률(OPM) 현재 및 전망

### ② 경쟁사 점유율 · 제품 기술
- 시장점유율 (자사 vs 경쟁사)
- 주요 고객사
- 핵심 제품이 무엇이고 왜 중요한지 기술 설명

### ③ 증권사 목표주가
- 강세론(Bull) 리포트: 기관, 목표가, 핵심 논리
- 약세론(Bear) 리포트: 기관, 목표가, 우려 포인트
- 컨센서스 목표가 및 현재가 대비 상승여력(%)

### ④ 동종업계 대비 강점 · 약점
- 강점 (기술력, 캐파, 마진, 고객 등)
- 약점 / 리스크 (밸류 부담, 고객 집중, 환율 등)

### ⑤ 업황 공급부족(쇼티지) 정도
- 공급부족 vs 공급과잉 현황
- 가동률, 리드타임, 재고 수준
- 향후 증설·수급 전망

### ⑥ 제품 단가(ASP) 흐름
- YoY / QoQ 단가 변화
- 향후 가격 인상 계획·전망
- 가격 상승이 실적에 미치는 레버리지

### ⑦ 계약의 질
- 단기 vs 장기계약(LTA) 여부
- 선수금, 마진 보장, take-or-pay 조건
- 수주잔고(백로그) 규모 및 고객 락인

### ⑧ 추가 투자 정보
- 환율 민감도, 정책·규제 리스크
- 대주주·지배구조 이슈, 신사업
- 배당·자사주, 매크로 연동성

### ⑨ 투자의견 (종합)
- "좋은 회사인가" vs "지금 가격이 좋은 주식인가" 구분
- 핵심 강세 논리 / 핵심 리스크
- 투자 트리거 (어떤 조건이 바뀌면 의견이 바뀌는지)
- ⚠️ 면책: 이 분석은 정보 제공 목적이며 투자권유가 아닙니다. 모든 수치는 검색 시점 기준이며 실제와 다를 수 있고, 최종 투자 판단과 책임은 투자자 본인에게 있습니다.

## 추가 지침
- 국내(KOSPI/KOSDAQ), 미국(NYSE/NASDAQ), 일본(TSE) 상장사 모두 대응
- 모든 핵심 수치에 기준 시점과 출처를 명시
- 확인 안 된 항목은 추정으로 채우지 말고 "확인 불가" 표기
- 웹 검색을 활용해 최신 정보를 반영할 것`;

const COLORS = {
  bg: "#f5f7fa",
  surface: "#ffffff",
  surfaceAlt: "#f0f4f9",
  border: "#e2e8f0",
  borderStrong: "#cbd5e1",
  accent: "#2563eb",
  accentLight: "#eff6ff",
  accentMid: "#bfdbfe",
  accentGlow: "#2563eb40",
  accentSoft: "#eff6ff",
  text: "#0f172a",
  textSub: "#334155",
  textSub: "#334155",
  textMuted: "#64748b",
  textDim: "#94a3b8",
  positive: "#059669",
  positiveLight: "#ecfdf5",
  negative: "#dc2626",
  negativeLight: "#fef2f2",
  warning: "#d97706",
  warningLight: "#fffbeb",
  highlight: "#7c3aed",
  highlightLight: "#f5f3ff",
};

const ITEMS = [
  { num: "①", label: "시가총액 · 밸류에이션",    icon: "📊", color: "#2563eb", bg: "#eff6ff",  detail: "PER·PBR·ROE·선행 PER을 EPS 계산식과 함께 제시. 영업이익률 현재 및 전망 포함." },
  { num: "②", label: "경쟁사 점유율 · 제품 기술", icon: "🏭", color: "#7c3aed", bg: "#f5f3ff",  detail: "시장점유율, 주요 고객사, 핵심 제품의 기술적 역할과 수요 전망 상세 설명." },
  { num: "③", label: "증권사 목표주가",           icon: "🎯", color: "#059669", bg: "#ecfdf5",  detail: "강세론(Bull)·약세론(Bear) 리포트를 모두 조사. 컨센서스 목표가와 상승여력(%) 제시." },
  { num: "④", label: "동종업계 강점 · 약점",      icon: "⚖️", color: "#d97706", bg: "#fffbeb",  detail: "피어 대비 기술력·마진·고객 측면 강점과 밸류 부담·리스크를 균형 있게 분석." },
  { num: "⑤", label: "업황 공급부족(쇼티지)",     icon: "📦", color: "#0d9488", bg: "#f0fdfa",  detail: "공급부족 vs 과잉 현황, 가동률·리드타임·재고 수준, 향후 증설 및 수급 전망." },
  { num: "⑥", label: "제품 단가(ASP) 흐름",       icon: "📈", color: "#db2777", bg: "#fdf2f8",  detail: "주력 제품 단가의 YoY·QoQ 변화와 향후 인상 계획, 실적 레버리지 구조 분석." },
  { num: "⑦", label: "계약의 질",                 icon: "📋", color: "#ea580c", bg: "#fff7ed",  detail: "장기계약(LTA) 여부, 선수금·마진 보장 조건, 수주잔고 규모와 고객 락인 여부." },
  { num: "⑧", label: "추가 투자 정보",            icon: "🔍", color: "#6366f1", bg: "#eef2ff",  detail: "환율 민감도, 규제 리스크, 지배구조, 신사업, 배당·자사주 등 투자 관련 변수." },
  { num: "⑨", label: "투자의견 (종합)",           icon: "💡", color: "#0f172a", bg: "#f8fafc",  detail: "8개 항목을 종합한 AI 투자의견. '좋은 회사 vs 좋은 주식'을 구분해 서술. 의견 변화 트리거 포함." },
];

function MarkdownRenderer({ content }) {
  const lines = content.split("\n");
  const elements = [];

  lines.forEach((line, i) => {
    if (line.startsWith("### ")) {
      elements.push(
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "30px", marginBottom: "12px" }}>
          <div style={{ width: "3px", height: "20px", borderRadius: "2px", background: COLORS.accent, flexShrink: 0 }} />
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: COLORS.text, letterSpacing: "-0.01em" }}>
            {line.replace("### ", "")}
          </h3>
        </div>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} style={{ fontSize: "16px", fontWeight: "800", color: COLORS.accent, marginTop: "28px", marginBottom: "10px" }}>
          {line.replace("## ", "")}
        </h2>
      );
    } else if (line.startsWith("- ")) {
      elements.push(
        <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "7px", paddingLeft: "4px" }}>
          <span style={{ color: COLORS.accent, fontSize: "12px", marginTop: "3px", flexShrink: 0 }}>▸</span>
          <span style={{ fontSize: "14px", color: COLORS.textSub, lineHeight: "1.7" }}>
            {line.replace("- ", "").split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
              p.startsWith("**") && p.endsWith("**")
                ? <strong key={j} style={{ color: COLORS.text, fontWeight: "700" }}>{p.replace(/\*\*/g, "")}</strong>
                : p
            )}
          </span>
        </div>
      );
    } else if (line.startsWith("⚠️")) {
      elements.push(
        <div key={i} style={{ marginTop: "22px", padding: "13px 17px", borderRadius: "9px", background: COLORS.warningLight, border: `1px solid #fde68a`, fontSize: "12px", color: COLORS.warning, lineHeight: "1.7" }}>
          {line}
        </div>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={i} style={{ height: "4px" }} />);
    } else {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      elements.push(
        <p key={i} style={{ fontSize: "14px", color: COLORS.textSub, margin: "5px 0", lineHeight: "1.75" }}>
          {parts.map((p, j) =>
            p.startsWith("**") && p.endsWith("**")
              ? <strong key={j} style={{ color: COLORS.text, fontWeight: "700" }}>{p.replace(/\*\*/g, "")}</strong>
              : p
          )}
        </p>
      );
    }
  });

  return <div>{elements}</div>;
}

export default function StockAnalyzer() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const resultRef = useRef(null);

  const quickSearches = ["삼성전기", "SK하이닉스", "NVIDIA", "무라타", "LG에너지솔루션"];

  const analyze = async (companyName) => {
    if (!companyName.trim() || isLoading) return;
    const userMsg = companyName.trim();
    setError(""); setStreamText(""); setIsLoading(true);
    const newHistory = [...history, { role: "user", content: userMsg }];
    setHistory(newHistory);
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 4000,
          system: SYSTEM_PROMPT,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: newHistory, stream: true,
        }),
      });
      if (!response.ok) { const e = await response.json(); throw new Error(e.error?.message || "API 오류"); }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "", buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n"); buffer = lines.pop();
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
                fullText += parsed.delta.text; setStreamText(fullText);
              }
            } catch {}
          }
        }
      }
      setHistory([...newHistory, { role: "assistant", content: fullText }]);
      setMessages(prev => [...prev, { company: userMsg, content: fullText, ts: new Date() }]);
    } catch (e) {
      setError(e.message || "분석 중 오류가 발생했습니다.");
    } finally { setIsLoading(false); }
  };

  const handleSubmit = () => { if (query.trim()) { analyze(query); setQuery(""); } };
  const handleKey = (e) => { if (e.key === "Enter") handleSubmit(); };

  const currentReport = streamText || (messages.length > 0 ? messages[messages.length - 1].content : "");
  const currentCompany = isLoading
    ? (history.filter(h => h.role === "user").pop()?.content || "")
    : (messages[messages.length - 1]?.company || "");
  const showLanding = !currentReport && !isLoading;

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, fontFamily: "'Pretendard', 'Apple SD Gothic Neo', -apple-system, sans-serif", color: COLORS.text }}>

      {/* ── Header ── */}
      <div style={{ background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`, padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 4px #0000000a" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "9px", background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.highlight})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "17px" }}>
            📊
          </div>
          <div>
            <div style={{ fontSize: "16px", fontWeight: "800", letterSpacing: "-0.03em", color: COLORS.text }}>Equity Lens</div>
            <div style={{ fontSize: "11px", color: COLORS.textMuted, letterSpacing: "0.05em" }}>AI-POWERED STOCK ANALYSIS</div>
          </div>
        </div>
        {messages.length > 0 && (
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {messages.map((m, i) => (
              <span key={i} style={{
                padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600",
                background: i === messages.length - 1 ? COLORS.accentLight : COLORS.surfaceAlt,
                border: `1px solid ${i === messages.length - 1 ? COLORS.accentMid : COLORS.border}`,
                color: i === messages.length - 1 ? COLORS.accent : COLORS.textMuted,
              }}>{m.company}</span>
            ))}
          </div>
        )}
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 24px 80px" }}>

        {/* ── Search ── */}
        <div style={{ padding: showLanding ? "48px 0 36px" : "28px 0 20px" }}>
          {showLanding && (
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <div style={{ fontSize: "30px", fontWeight: "900", letterSpacing: "-0.04em", lineHeight: "1.2", marginBottom: "10px", color: COLORS.text }}>
                종목명 하나로&nbsp;
                <span style={{ color: COLORS.accent }}>9개 항목</span> 심층 분석 리포트
              </div>
              <div style={{ fontSize: "14px", color: COLORS.textMuted }}>
                국내(KOSPI·KOSDAQ) · 미국(NYSE·NASDAQ) · 일본(TSE) 상장사 지원 · 실시간 웹 검색 포함
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "8px", alignItems: "center", background: COLORS.surface, border: `1.5px solid ${COLORS.borderStrong}`, borderRadius: "14px", padding: "6px 6px 6px 18px", boxShadow: "0 2px 12px #0000000e" }}>
            <span style={{ fontSize: "17px", opacity: 0.4 }}>🔍</span>
            <input
              value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKey}
              placeholder="기업명 또는 티커 입력  (예: 삼성전기, NVDA, 6981.T)"
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "15px", color: COLORS.text, padding: "10px 0" }}
            />
            <button onClick={handleSubmit} disabled={isLoading || !query.trim()}
              style={{
                padding: "11px 26px", borderRadius: "10px", border: "none",
                background: isLoading || !query.trim() ? COLORS.surfaceAlt : `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.highlight})`,
                color: isLoading || !query.trim() ? COLORS.textDim : "#fff",
                fontSize: "14px", fontWeight: "700", cursor: isLoading || !query.trim() ? "not-allowed" : "pointer",
                transition: "all 0.2s", whiteSpace: "nowrap",
                boxShadow: isLoading || !query.trim() ? "none" : `0 2px 10px ${COLORS.accentGlow}`,
              }}
            >{isLoading ? "분석 중…" : "분석하기"}</button>
          </div>

          {showLanding && (
            <div style={{ display: "flex", gap: "8px", marginTop: "14px", flexWrap: "wrap", justifyContent: "center", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: COLORS.textDim }}>빠른 검색</span>
              {quickSearches.map(s => (
                <button key={s} onClick={() => { setQuery(s); analyze(s); }}
                  style={{ padding: "5px 14px", borderRadius: "20px", fontSize: "12px", background: COLORS.surface, border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, cursor: "pointer", transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.accent; e.currentTarget.style.color = COLORS.accent; e.currentTarget.style.background = COLORS.accentLight; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.color = COLORS.textMuted; e.currentTarget.style.background = COLORS.surface; }}
                >{s}</button>
              ))}
            </div>
          )}
        </div>

        {/* ── 9개 항목 테이블 (랜딩 전용) ── */}
        {showLanding && (
          <div style={{ marginBottom: "48px" }}>
            {/* 섹션 타이틀 */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", color: COLORS.textSub, letterSpacing: "0.01em", whiteSpace: "nowrap" }}>
                리포트에 포함되는 9개 분석 항목
              </span>
              <div style={{ flex: 1, height: "1px", background: COLORS.border }} />
            </div>

            {/* 테이블 */}
            <div style={{ background: COLORS.surface, borderRadius: "14px", border: `1px solid ${COLORS.border}`, overflow: "hidden", boxShadow: "0 2px 12px #0000000a" }}>
              {/* 헤더 행 */}
              <div style={{ display: "grid", gridTemplateColumns: "56px 200px 1fr", background: COLORS.surfaceAlt, borderBottom: `1px solid ${COLORS.border}`, padding: "10px 20px" }}>
                {["NO", "분석 항목", "분석 내용"].map(h => (
                  <div key={h} style={{ fontSize: "11px", fontWeight: "700", color: COLORS.textMuted, letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</div>
                ))}
              </div>

              {/* 데이터 행 */}
              {ITEMS.map((item, idx) => (
                <div key={idx}
                  style={{ display: "grid", gridTemplateColumns: "56px 200px 1fr", padding: "13px 20px", alignItems: "center", borderBottom: idx < ITEMS.length - 1 ? `1px solid ${COLORS.border}` : "none", transition: "background 0.15s", cursor: "default" }}
                  onMouseEnter={e => e.currentTarget.style.background = item.bg}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  {/* 번호 뱃지 */}
                  <div>
                    <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: item.bg, border: `1.5px solid ${item.color}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "800", color: item.color }}>
                      {idx + 1}
                    </div>
                  </div>
                  {/* 항목명 */}
                  <div style={{ fontSize: "14px", fontWeight: "700", color: COLORS.text }}>
                    {item.icon}&nbsp; {item.label}
                  </div>
                  {/* 설명 */}
                  <div style={{ fontSize: "13px", color: COLORS.textMuted, lineHeight: "1.6" }}>
                    {item.detail}
                  </div>
                </div>
              ))}
            </div>

            {/* 하단 3 포인트 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginTop: "14px" }}>
              {[
                { icon: "⚡", text: "실시간 웹 검색으로 최신 데이터 반영" },
                { icon: "⚖️", text: "Bull·Bear 양쪽 시각을 균형 있게 제시" },
                { icon: "✅", text: "확인 불가 항목은 추정 없이 솔직히 명시" },
              ].map((f, i) => (
                <div key={i} style={{ padding: "12px 16px", borderRadius: "10px", background: COLORS.surface, border: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "15px" }}>{f.icon}</span>
                  <span style={{ fontSize: "12px", color: COLORS.textMuted, lineHeight: "1.5" }}>{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div style={{ padding: "14px 18px", borderRadius: "10px", marginBottom: "20px", background: COLORS.negativeLight, border: `1px solid #fca5a5`, color: COLORS.negative, fontSize: "14px" }}>
            ⚠️ {error}
          </div>
        )}

        {/* ── Report ── */}
        {(currentReport || isLoading) && (
          <div ref={resultRef}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "18px", flexWrap: "wrap" }}>
              <div style={{ fontSize: "22px", fontWeight: "900", letterSpacing: "-0.03em", color: COLORS.text }}>{currentCompany}</div>
              <div style={{ fontSize: "13px", color: COLORS.textMuted }}>Equity Research Report</div>
              <div style={{ marginLeft: "auto", fontSize: "12px", color: isLoading ? COLORS.accent : COLORS.textDim }}>
                {isLoading ? "⟳ 웹 검색 · 분석 중…" : messages[messages.length-1]?.ts?.toLocaleTimeString("ko-KR")}
              </div>
            </div>

            <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: "16px", padding: "28px 32px", boxShadow: "0 2px 20px #0000000d", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.highlight}, transparent)` }} />

              {isLoading && !currentReport && (
                <div style={{ padding: "56px 0", textAlign: "center" }}>
                  <div style={{ fontSize: "28px", marginBottom: "14px" }}>🔍</div>
                  <div style={{ color: COLORS.textMuted, fontSize: "14px" }}>웹 검색 중 · 최신 데이터 수집 중…</div>
                </div>
              )}

              {currentReport && <MarkdownRenderer content={currentReport} />}

              {isLoading && currentReport && (
                <span style={{ display: "inline-block", width: "7px", height: "15px", background: COLORS.accent, marginLeft: "2px", verticalAlign: "middle", animation: "blink 0.7s infinite" }} />
              )}
            </div>

            {/* 추가 질문 */}
            {!isLoading && messages.length > 0 && (
              <div style={{ marginTop: "16px", padding: "16px 20px", background: COLORS.surface, borderRadius: "12px", border: `1px solid ${COLORS.border}` }}>
                <div style={{ fontSize: "12px", color: COLORS.textMuted, marginBottom: "10px" }}>💬 추가 질문</div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKey}
                    placeholder="예: 경쟁사 무라타와 비교해줘 / 지금 비싸?"
                    style={{ flex: 1, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: COLORS.text, outline: "none" }}
                  />
                  <button onClick={handleSubmit} disabled={!query.trim()}
                    style={{ padding: "10px 18px", borderRadius: "8px", border: "none", background: !query.trim() ? COLORS.surfaceAlt : COLORS.accentLight, color: !query.trim() ? COLORS.textDim : COLORS.accent, fontSize: "13px", fontWeight: "700", cursor: !query.trim() ? "not-allowed" : "pointer" }}
                  >전송</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        * { box-sizing: border-box; }
        input::placeholder { color: #94a3b8; }
      `}</style>
    </div>
  );
}
