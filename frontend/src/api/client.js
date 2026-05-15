export async function requestJson(path, options = {}) {
  const response = await fetch(path, options);
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    const message = data?.detail?.message || data?.detail || "요청을 처리하지 못했습니다.";
    throw new Error(message);
  }

  return data;
}

export function getConfidenceState(confidence) {
  if (confidence >= 0.9) {
    return { label: "안정", className: "confidence-stable" };
  }
  if (confidence >= 0.7) {
    return { label: "확인 필요", className: "confidence-review" };
  }
  return { label: "다시 보기", className: "confidence-retry" };
}
