# 📊 Equity Lens

AI 기반 기업 심층 분석 도구. 종목명 하나로 9개 항목 리포트를 자동 생성합니다.

## 로컬 실행

```bash
npm install
npm run dev
```

## Vercel 배포

1. [vercel.com](https://vercel.com) 로그인 → **Add New Project**
2. GitHub 레포 연동 후 Import
3. **Environment Variables** 탭에서 추가:
   - Key: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-...` (본인 API 키)
4. **Deploy** 클릭

끝. 자동으로 `https://프로젝트명.vercel.app` 주소가 생깁니다.
