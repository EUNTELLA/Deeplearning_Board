import React from "react";
import { createRoot } from "react-dom/client";
import { Camera, ChevronLeft, ImagePlus, Save, Trash2 } from "lucide-react";
import { requestJson, getConfidenceState } from "./api/client";
import "./style.css";

const fallbackLabels = Array.from({ length: 26 }, (_, index) => String.fromCharCode(65 + index));

function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function Link({ href, children, className, current, ...props }) {
  return (
    <a
      className={className}
      href={href}
      aria-current={current ? "page" : undefined}
      {...props}
      onClick={(event) => {
        event.preventDefault();
        navigate(href);
      }}
    >
      {children}
    </a>
  );
}

function Navbar({ path }) {
  return (
    <header className="navbar">
      <Link className="brand" href="/">
        <span className="brand-mark">ASL</span>
        <span>ASL Letter Board</span>
      </Link>
      <nav>
        <Link href="/" current={path === "/"}>홈</Link>
        <Link href="/classify" current={path === "/classify"}>분류</Link>
        <Link href="/love-learning" current={path === "/love-learning"}>단어 학습</Link>
        <Link href="/board" current={path === "/board"}>게시판</Link>
      </nav>
    </header>
  );
}

function Home() {
  const [intro, setIntro] = React.useState(() => sessionStorage.getItem("intro-done") === "1");

  function startIntro() {
    sessionStorage.setItem("intro-done", "1");
    setIntro(true);
  }

  return (
    <>
      {!intro && (
        <div className="intro-overlay">
          <div className="intro-content">
            <button className="intro-start-btn" type="button" onClick={startIntro}>시작</button>
          </div>
        </div>
      )}
      <section className={`home-hero ${intro ? "" : "is-hidden"}`}>
        <div>
          <p className="eyebrow">ASL A-Z Learning</p>
          <h1>ASL A-Z 수화 알파벳 분류 게시판</h1>
          <p>웹캠이나 이미지를 통해 ASL 알파벳 A부터 Z까지 대략적으로 구분하고, 결과를 게시판에 저장해 간단한 학습 기록처럼 관리할 수 있습니다.</p>
          <div className="home-actions">
            <Link className="button-link" href="/classify">분류 시작</Link>
            <Link className="button-link secondary-link" href="/love-learning">단어 학습하기</Link>
            <Link className="button-link secondary-link" href="/board">학습 기록 보기</Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Classify() {
  const [file, setFile] = React.useState(null);
  const [preview, setPreview] = React.useState("");
  const [result, setResult] = React.useState(null);
  const [dragging, setDragging] = React.useState(false);
  const [stream, setStream] = React.useState(null);
  const videoRef = React.useRef(null);

  React.useEffect(() => () => stopCamera(), [stream]);

  function stopCamera() {
    if (!stream) return;
    stream.getTracks().forEach((track) => track.stop());
    setStream(null);
  }

  function selectFile(nextFile) {
    if (!nextFile) return;
    stopCamera();
    setFile(nextFile);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(nextFile);
  }

  async function runPrediction(blob, filename = "capture.jpg") {
    const formData = new FormData();
    formData.append("file", blob, filename);

    try {
      const data = await requestJson("/api/v1/predict", { method: "POST", body: formData });
      setResult(data);
    } catch (error) {
      alert(error.message);
    }
  }

  async function submit(event) {
    event.preventDefault();
    if (!file) {
      alert("이미지를 선택해 주세요.");
      return;
    }
    await runPrediction(file, file.name);
  }

  async function toggleCamera() {
    if (stream) {
      stopCamera();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      alert("이 브라우저에서는 웹캠을 사용할 수 없습니다.");
      return;
    }
    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      setPreview("");
      setStream(nextStream);
      if (videoRef.current) {
        videoRef.current.srcObject = nextStream;
      }
    } catch {
      alert("웹캠 권한을 허용해 주세요.");
    }
  }

  React.useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  async function captureCamera() {
    const video = videoRef.current;
    if (!stream || !video?.videoWidth) {
      alert("웹캠 화면을 불러오는 중입니다.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setPreview(dataUrl);
    stopCamera();

    canvas.toBlob(async (blob) => {
      if (!blob) {
        alert("웹캠 이미지를 캡처하지 못했습니다.");
        return;
      }
      const capturedFile = new File([blob], "webcam-capture.jpg", { type: "image/jpeg" });
      setFile(capturedFile);
      await runPrediction(blob, "webcam-capture.jpg");
    }, "image/jpeg", 0.92);
  }

  async function savePost() {
    if (!result) return;
    try {
      const post = await requestJson("/api/v1/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `ASL ${result.predicted_class} 분류 결과`,
          image_url: preview,
          prediction: result.predicted_class,
          confidence: result.confidence,
        }),
      });
      navigate(`/post/${post.id}`);
    } catch {
      alert("학습 기록을 저장하지 못했습니다.");
    }
  }

  return (
    <>
      <section className="page-heading">
        <p className="eyebrow">ASL A-Z Classification</p>
        <h1>ASL 알파벳 이미지를 분류하세요</h1>
        <p>A부터 Z까지의 영어 수화 이미지를 업로드하거나 웹캠으로 촬영해 어떤 알파벳에 가까운지 간단히 구분합니다.</p>
      </section>
      <section className={`predict-layout ${result ? "has-result" : ""}`}>
        <section className="upload-box card">
          <div className="section-title">
            <h2>수화 이미지 입력</h2>
            <span>JPG, PNG · 최대 10MB</span>
          </div>
          <form onSubmit={submit}>
            <label
              className={`upload-area ${preview ? "has-image" : ""} ${stream ? "is-camera" : ""} ${dragging ? "is-dragging" : ""}`}
              onDragEnter={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={(event) => {
                event.preventDefault();
                setDragging(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                const dropped = event.dataTransfer.files[0];
                if (dropped?.type.startsWith("image/")) {
                  selectFile(dropped);
                }
              }}
            >
              <input type="file" accept="image/*" onChange={(event) => selectFile(event.target.files[0])} />
              {stream && <video ref={videoRef} autoPlay playsInline muted />}
              {preview && <img id="preview" src={preview} alt="" />}
              {!preview && !stream && <span><ImagePlus size={22} /> ASL A-Z 이미지 선택 또는 드래그</span>}
            </label>
            <div className="webcam-controls">
              <button className="secondary-btn" type="button" onClick={toggleCamera}>
                <Camera size={18} /> {stream ? "웹캠 끄기" : "웹캠 시작"}
              </button>
              {stream && <button type="button" onClick={captureCamera}>촬영 후 분석</button>}
            </div>
            <button type="submit">알파벳 분류</button>
          </form>
        </section>
        {result && (
          <section className="card result-card">
            <div className="section-title">
              <h2>구분 결과</h2>
              <span>Top 5</span>
            </div>
            <div className="result-summary">
              <span>{result.predicted_class}</span>
              <strong>신뢰도 {(result.confidence * 100).toFixed(2)}%</strong>
            </div>
            <ul className="score-list">
              {result.top_k.map((item) => (
                <li key={item.label}>
                  <span>{item.label}</span>
                  <span className="score-track"><span className="score-bar" style={{ width: `${(item.score * 100).toFixed(2)}%` }} /></span>
                  <strong>{(item.score * 100).toFixed(1)}%</strong>
                </li>
              ))}
            </ul>
            <button type="button" onClick={savePost}><Save size={18} /> 학습 기록으로 저장</button>
          </section>
        )}
      </section>
    </>
  );
}

function Board() {
  const [labels, setLabels] = React.useState(fallbackLabels);
  const [posts, setPosts] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [category, setCategory] = React.useState(() => new URLSearchParams(window.location.search).get("category") || "");
  const limit = 6;

  React.useEffect(() => {
    requestJson("/api/v1/predict/labels")
      .then((data) => setLabels(Array.isArray(data.classes) && data.classes.length ? data.classes : fallbackLabels))
      .catch(() => setLabels(fallbackLabels));
  }, []);

  React.useEffect(() => {
    loadPosts(0, true);
  }, [category]);

  async function loadPosts(skip = posts.length, reset = false) {
    const params = new URLSearchParams({ skip, limit });
    if (category) params.set("category", category);
    const data = await requestJson(`/api/v1/posts?${params.toString()}`);
    setPosts((current) => (reset ? data.items : [...current, ...data.items]));
    setTotal(data.total);
  }

  return (
    <>
      <section className="page-heading compact">
        <p className="eyebrow">Learning Archive</p>
        <h1>ASL A-Z 학습 기록</h1>
        <p>저장된 구분 결과를 A-Z 알파벳별로 확인하고, 제목 수정과 삭제를 할 수 있습니다.</p>
      </section>
      <section className="toolbar">
        <Link className="button-link" href="/classify">새 알파벳 분류</Link>
        <div className="alphabet-tabs" aria-label="알파벳 필터">
          {["", ...labels].map((label) => (
            <button
              key={label || "all"}
              type="button"
              className={`tab-chip ${category === label ? "is-active" : ""}`}
              onClick={() => {
                setCategory(label);
                window.history.replaceState({}, "", label ? `/board?category=${encodeURIComponent(label)}` : "/board");
              }}
            >
              {label || "전체"}
            </button>
          ))}
        </div>
      </section>
      <section className="post-grid">
        {posts.length === 0 && <p className="empty-state">아직 저장된 ASL 학습 기록이 없습니다. 분류 화면에서 A-Z 결과를 저장해 주세요.</p>}
        {posts.map((post, index) => {
          const state = getConfidenceState(post.confidence);
          return (
            <Link className="post-card" href={`/post/${post.id}`} key={post.id} style={{ "--card-delay": `${index * 0.05}s` }}>
              <img src={post.image_url} alt={post.title} />
              <div className="post-body">
                <div className="post-letter-row">
                  <strong className="post-letter">{post.prediction}</strong>
                  <span className={`confidence-badge ${state.className}`}>{state.label}</span>
                </div>
                <h3>{post.title}</h3>
                <div className="post-meta">
                  <span className="post-confidence">{(post.confidence * 100).toFixed(1)}%</span>
                  <span className="post-label">ASL {post.prediction}</span>
                </div>
                <span className="detail-link">상세 보기</span>
              </div>
            </Link>
          );
        })}
        {posts.length < total && <button id="loadMoreBtn" type="button" onClick={() => loadPosts()}>더 보기</button>}
      </section>
    </>
  );
}

function PostDetail({ id }) {
  const [post, setPost] = React.useState(null);
  const [notFound, setNotFound] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [title, setTitle] = React.useState("");

  React.useEffect(() => {
    requestJson(`/api/v1/posts/${id}`)
      .then((data) => {
        setPost(data);
        setTitle(data.title);
      })
      .catch(() => setNotFound(true));
  }, [id]);

  async function saveTitle() {
    const nextTitle = title.trim();
    if (!nextTitle) {
      alert("제목을 입력해 주세요.");
      return;
    }
    const data = await requestJson(`/api/v1/posts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: nextTitle }),
    });
    setPost(data);
    setTitle(data.title);
    setEditing(false);
  }

  async function deletePost() {
    if (!confirm("게시글을 삭제할까요?")) return;
    await requestJson(`/api/v1/posts/${id}`, { method: "DELETE" });
    navigate("/board");
  }

  if (notFound) return <div className="empty-state">학습 기록을 찾을 수 없습니다.</div>;
  if (!post) return <div className="empty-state">불러오는 중입니다.</div>;
  const state = getConfidenceState(post.confidence);

  return (
    <main className="detail-shell">
      <article className="detail-card card">
        <img className="detail-image" src={post.image_url} alt={post.title} />
        <div className="detail-body">
          <p className="eyebrow">Saved ASL Prediction</p>
          <div className="detail-title-row">
            <h1>{post.title}</h1>
            <div className="detail-actions">
              <button className="secondary-btn" type="button" onClick={() => setEditing(true)}>수정</button>
              <button className="danger-btn" type="button" onClick={deletePost}><Trash2 size={18} /> 삭제</button>
            </div>
          </div>
          {editing && (
            <div className="detail-title-editor">
              <input className="title-input" value={title} aria-label="게시글 제목" onChange={(event) => setTitle(event.target.value)} />
              <button type="button" onClick={saveTitle}>저장</button>
              <button className="secondary-btn" type="button" onClick={() => setEditing(false)}>취소</button>
            </div>
          )}
          <div className="result-row"><span>예측 알파벳</span><strong>{post.prediction}</strong></div>
          <div className="result-row"><span>신뢰도</span><strong>{(post.confidence * 100).toFixed(1)}%</strong></div>
          <div className="result-row"><span>판단 상태</span><strong className={`confidence-badge ${state.className}`}>{state.label}</strong></div>
          <div className="detail-link-row">
            <Link className="button-link secondary-link" href={`/board?category=${encodeURIComponent(post.prediction)}`}>같은 알파벳 보기</Link>
            <Link className="button-link" href="/classify">다시 분류하기</Link>
          </div>
        </div>
      </article>
    </main>
  );
}

function LoveLearning() {
  const [stream, setStream] = React.useState(null);
  const [word, setWord] = React.useState("LOVE");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [sampleMap, setSampleMap] = React.useState({});
  const videoRef = React.useRef(null);
  const letters = React.useMemo(() => word.toUpperCase().replace(/[^A-Z]/g, "").split(""), [word]);
  const currentIndex = letters.length > 0 ? Math.min(activeIndex, letters.length - 1) : 0;
  const activeLetter = letters[currentIndex] || "";

  async function startPractice() {
    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(nextStream);
      if (videoRef.current) videoRef.current.srcObject = nextStream;
    } catch {
      alert("웹캠 권한을 허용해 주세요.");
    }
  }

  React.useEffect(() => {
    fetch("/word-images/manifest.json")
      .then((response) => response.ok ? response.json() : [])
      .then((items) => {
        const nextMap = {};
        items.forEach((item) => {
          if (item.letter && item.display_file && !nextMap[item.letter]) {
            nextMap[item.letter] = `/word-images/${item.display_file}`;
          }
        });
        setSampleMap(nextMap);
      })
      .catch(() => setSampleMap({}));
  }, []);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [word]);

  React.useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
    return () => stream?.getTracks().forEach((track) => track.stop());
  }, [stream]);

  return (
    <>
      <section className="page-heading">
        <p className="eyebrow">Word Learning</p>
        <h1>단어 ASL 알파벳 학습</h1>
        <p>원하는 영어 단어를 입력하고 알파벳별 ASL 손 모양을 순서대로 확인하세요.</p>
      </section>
      <section className="word-learning">
        <div className="word-input-panel">
          <label htmlFor="wordInput">학습할 단어</label>
          <input
            id="wordInput"
            value={word}
            maxLength={18}
            placeholder="예: LOVE, APPLE, HELLO"
            onChange={(event) => setWord(event.target.value)}
          />
        </div>

        <div className="love-letters">
          {letters.map((letter, index) => (
            <button
              type="button"
              className={`letter letter-choice ${index === currentIndex ? "is-active" : ""}`}
              key={`${letter}-${index}`}
              onClick={() => setActiveIndex(index)}
            >
              <h3>{letter}</h3>
              <img
                src={sampleMap[letter] || `/word-images/letters/${letter}.jpg`}
                alt={`${letter} 손 모양`}
                onError={(event) => { event.currentTarget.src = "/static/images/placeholder.jpg"; }}
              />
              <p>{index + 1}번째 글자</p>
            </button>
          ))}
        </div>

        {letters.length > 0 ? (
          <div className="practice-compare">
            <div className="letter focus-letter">
              <span className="letter-step">{currentIndex + 1} / {letters.length}</span>
              <h3>{activeLetter}</h3>
              <img
                src={sampleMap[activeLetter] || `/word-images/letters/${activeLetter}.jpg`}
                alt={`${activeLetter} 손 모양`}
                onError={(event) => { event.currentTarget.src = "/static/images/placeholder.jpg"; }}
              />
              <p>{activeLetter} 손 모양을 웹캠 거울로 비교해보세요.</p>
              <div className="letter-controls">
                <button type="button" className="secondary-btn" onClick={() => setActiveIndex(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0}>
                  <ChevronLeft size={18} /> 이전
                </button>
                <button type="button" onClick={() => setActiveIndex(Math.min(letters.length - 1, currentIndex + 1))} disabled={currentIndex === letters.length - 1}>
                  다음
                </button>
              </div>
            </div>
            <div className="practice">
              <h3>거울 연습</h3>
              <p>판정 없이 웹캠 화면으로 내 손 모양을 샘플과 직접 비교합니다.</p>
              <button type="button" onClick={startPractice}><Camera size={18} /> 웹캠 켜기</button>
              <video ref={videoRef} width="640" height="480" autoPlay playsInline muted />
              <canvas width="640" height="480" />
            </div>
          </div>
        ) : (
          <p className="empty-state">A-Z 영어 알파벳으로 단어를 입력해 주세요.</p>
        )}
      </section>
      <footer><p>&copy; 2023 ASL Learning Board</p></footer>
    </>
  );
}

function WebcamTest() {
  const [cameras, setCameras] = React.useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = React.useState("");
  const [status, setStatus] = React.useState("대기 중");
  const [stream, setStream] = React.useState(null);
  const videoRef = React.useRef(null);

  async function loadCameras() {
    if (!navigator.mediaDevices?.enumerateDevices) {
      setCameras([]);
      setStatus("장치 목록을 사용할 수 없습니다.");
      return [];
    }
    const devices = await navigator.mediaDevices.enumerateDevices();
    const nextCameras = devices.filter((device) => device.kind === "videoinput");
    setCameras(nextCameras);
    if (!selectedDeviceId && nextCameras[0]) {
      setSelectedDeviceId(nextCameras[0].deviceId);
    }
    return nextCameras;
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
    setStatus("중지됨");
  }

  async function startCamera(mode) {
    stopCamera();
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("실패: 이 브라우저에서 getUserMedia를 지원하지 않습니다.");
      return;
    }

    try {
      const availableCameras = await loadCameras();
      const useSafeMode = mode === "safe";
      const video = {
        width: useSafeMode ? { ideal: 640 } : { ideal: 1280 },
        height: useSafeMode ? { ideal: 480 } : { ideal: 720 },
      };
      if (selectedDeviceId) {
        video.deviceId = { exact: selectedDeviceId };
      }

      const nextStream = await navigator.mediaDevices.getUserMedia({ video, audio: false });
      setStream(nextStream);
      if (videoRef.current) {
        videoRef.current.srcObject = nextStream;
      }
      const track = nextStream.getVideoTracks()[0];
      const settings = track.getSettings();
      setStatus([
        "성공: 웹캠 스트림이 열렸습니다.",
        `카메라 개수: ${availableCameras.length}`,
        `사용 중: ${track.label || "이름 확인 불가"}`,
        `해상도: ${settings.width || "?"} x ${settings.height || "?"}`,
      ].join("\n"));
      await loadCameras();
    } catch (error) {
      setStatus([
        "실패: 웹캠을 열 수 없습니다.",
        `이름: ${error.name}`,
        `메시지: ${error.message}`,
        "",
        "확인:",
        "1. Windows 카메라 앱, Zoom, Teams, OBS, 다른 브라우저 탭을 모두 종료",
        "2. USB 웹캠이면 뺐다가 다시 연결",
        "3. 저해상도 테스트 버튼으로 다시 시도",
      ].join("\n"));
    }
  }

  React.useEffect(() => {
    loadCameras().catch((error) => setStatus(`장치 목록을 불러오지 못했습니다: ${error.message}`));
    return () => stream?.getTracks().forEach((track) => track.stop());
  }, []);

  return (
    <main className="webcam-test-shell">
      <section className="page-heading compact">
        <p className="eyebrow">Webcam Test</p>
        <h1>웹캠 테스트</h1>
      </section>
      <div className="toolbar webcam-test-toolbar">
        <select value={selectedDeviceId} onChange={(event) => setSelectedDeviceId(event.target.value)}>
          {cameras.length === 0 && <option>카메라 없음</option>}
          {cameras.map((camera, index) => (
            <option value={camera.deviceId} key={camera.deviceId}>{camera.label || `카메라 ${index + 1}`}</option>
          ))}
        </select>
        <button type="button" onClick={() => startCamera("normal")}>웹캠 테스트</button>
        <button className="secondary-btn" type="button" onClick={() => startCamera("safe")}>저해상도 테스트</button>
        <button className="secondary-btn" type="button" onClick={stopCamera}>중지</button>
      </div>
      <video className="webcam-test-video" ref={videoRef} autoPlay playsInline muted />
      <pre className="webcam-test-status">{status}</pre>
    </main>
  );
}

function App() {
  const [path, setPath] = React.useState(window.location.pathname);

  React.useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const postMatch = path.match(/^\/post\/(\d+)$/);

  return (
    <>
      <Navbar path={path} />
      {path === "/" && <Home />}
      {path === "/classify" && <Classify />}
      {path === "/board" && <Board />}
      {path === "/love-learning" && <LoveLearning />}
      {path === "/webcam-test" && <WebcamTest />}
      {postMatch && <PostDetail id={postMatch[1]} />}
      {!["/", "/classify", "/board", "/love-learning", "/webcam-test"].includes(path) && !postMatch && (
        <div className="empty-state">
          <p>페이지를 찾을 수 없습니다.</p>
          <button type="button" onClick={() => navigate("/")}>
            <ChevronLeft size={18} /> 홈으로
          </button>
        </div>
      )}
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
