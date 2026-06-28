import React, { useState, useRef, useEffect } from "react";
import logo from "./assets/quran.jpeg";
import {
  Send,
  MessageCircle,
  BookOpen,
  Bookmark,
  Info,
  User,
  Moon,
  Search,
  Trash2,
  Star,
  History,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

export default function App() {
  const [activeMenu, setActiveMenu] = useState("chat");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      type: "text",
      text: "Assalamu’alaikum, silakan tanyakan ayat Al-Qur’an yang ingin Anda cari.",
    },
  ]);
  const [bookmarks, setBookmarks] = useState([]);
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [highlightAyat, setHighlightAyat] = useState(null);
  const [targetMessageIndex, setTargetMessageIndex] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);

const openSurahFromResult = (item, messageIndex) => {
  setSelectedSurah(item.nomor_surah);
  setHighlightAyat(item.nomor_ayat);
  setTargetMessageIndex(messageIndex);
  setActiveMenu("surah");
};
const backToChatQuestion = () => {
  setActiveMenu("chat");

  setTimeout(() => {
    if (targetMessageIndex !== null) {
      const el = document.getElementById(`message-${targetMessageIndex}`);
      if (el) {
        el.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, 250);
};
const backToChat = () => {
  setActiveMenu("chat");
  setTimeout(() => {
    const el = document.getElementById("chat-bottom");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }, 200);
};

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userText = input;
    setInput("");
    setSearchHistory((prev) => [
    {
     query: userText,
     time: new Date().toLocaleString("id-ID"),
    },
      ...prev,
    ]);

    setMessages((prev) => [
      ...prev,
      { role: "user", type: "text", text: userText },
    ]);

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });

      const data = await res.json();

      if (data.status === "allow") {
        setMessages((prev) => [
       ...prev,
       {
         role: "bot",
         type: "results",
         text: data.message,
        results: data.results,
       },
    ]);
} else if (
  data.status === "block" ||
  data.status === "clarify" ||
  data.status === "not_found" ||
  data.status === "error"
) {
  setMessages((prev) => [
    ...prev,
    {
      role: "bot",
      type: "text",
      text: data.message,
    },
  ]);
} else {
  setMessages((prev) => [
    ...prev,
    {
      role: "bot",
      type: "text",
      text: "Respons dari server tidak dikenali.",
    },
  ]);
}
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          type: "text",
          text: "Terjadi kesalahan koneksi ke server.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const addBookmark = (item) => {
    const exists = bookmarks.some(
      (b) =>
        b.nomor_surah === item.nomor_surah &&
        b.nomor_ayat === item.nomor_ayat
    );

    if (!exists) {
      setBookmarks((prev) => [...prev, item]);
    }
  };

  const removeBookmark = (item) => {
  setBookmarks((prev) =>
    prev.filter(
      (b) =>
        !(
          b.nomor_surah === item.nomor_surah &&
          b.nomor_ayat === item.nomor_ayat
        )
    )
  );
};

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo-box">
          <img src={logo} alt="QuranBot Logo" className="sidebar-logo" />
        </div>

        <nav className="menu">
          <MenuItem
            icon={<MessageCircle size={22} />}
            label="Chat"
            active={activeMenu === "chat"}
            onClick={() => setActiveMenu("chat")}
          />
          <MenuItem
            icon={<BookOpen size={22} />}
            label="Daftar Surah"
            active={activeMenu === "surah"}
            onClick={() => setActiveMenu("surah")}
          />
          <MenuItem
            icon={<Bookmark size={22} />}
            label="Bookmark"
            active={activeMenu === "bookmark"}
            onClick={() => setActiveMenu("bookmark")}
          />
          <MenuItem
            icon={<Info size={22} />}
            label="About"
            active={activeMenu === "about"}
            onClick={() => setActiveMenu("about")}
          />
          <MenuItem
            icon={<History size={22} />}
            label="Riwayat"
            active={activeMenu === "history"}
            onClick={() => setActiveMenu("history")}
          />
        </nav>

        <div className="sidebar-footer">
          <Moon size={20} />
          <div>
            <strong>QuranBot</strong>
            <p>@2026</p>
          </div>
        </div>
      </aside>

      <main className="main">
        {activeMenu === "chat" && (
          <ChatPage
          input={input}
          setInput={setInput}
          sendMessage={sendMessage}
          messages={messages}
          loading={loading}
          addBookmark={addBookmark}
          openSurahFromResult={openSurahFromResult}
          />
        )}

        {activeMenu === "surah" && (
          <SurahPage
           selectedSurah={selectedSurah}
           setSelectedSurah={setSelectedSurah}
           highlightAyat={highlightAyat}
           setHighlightAyat={setHighlightAyat}
           backToChatQuestion={backToChatQuestion}
          />
        )}
        {activeMenu === "bookmark" && (
         <BookmarkPage
          bookmarks={bookmarks}
          removeBookmark={removeBookmark}
          openSurahFromResult={openSurahFromResult}
         />
        )}
        {activeMenu === "about" && <AboutPage />}
        {activeMenu === "history" && (
        <HistoryPage
         searchHistory={searchHistory}
         setInput={setInput}
         setActiveMenu={setActiveMenu}
        />
         )}
      </main>
    </div>
  );
}

function MenuItem({ icon, label, active, onClick }) {
  return (
    <button className={`menu-item ${active ? "active" : ""}`} onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function ChatPage({
  input,
  setInput,
  sendMessage,
  messages,
  loading,
  addBookmark,
  openSurahFromResult,
}) {
  const chatBottomRef = useRef(null);

   useEffect(() => {
  if (chatBottomRef.current) {
    chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
   }
   }, [messages, loading]);

  return (
    <section className="chat-page">
      <header className="chat-header">
        <img src={logo} alt="QuranBot Logo" className="header-logo" />
        <div>
          <h2>QuranBot</h2>
          <p>Chatbot Eksplorasi Ayat Al-Qur’an</p>
        </div>
      </header>

      <div className="chat-body">
        {messages.map((msg, idx) => (
       <div
           key={idx}
           id={`message-${idx}`}
           className={`message-row ${msg.role}`}
           >
            {msg.role === "bot" && (
              <div className="small-avatar">
                <img src={logo} alt="QuranBot" />
              </div>
              
            )}

            <div className={`message ${msg.role}`}>
              {msg.type === "text" && <p>{msg.text}</p>}

              {msg.type === "results" && (
                <>
                  <p className="result-title">{msg.text}</p>
                  <div className="result-list">
                    {msg.results.map((item, index) => (
                      <ResultCard
                        key={index}
                        item={item}
                        index={index}
                        messageIndex={idx - 1}
                        addBookmark={addBookmark}
                        openSurahFromResult={openSurahFromResult}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {msg.role === "user" && (
              <div className="user-avatar">
                <User size={26} />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="message-row bot">
            <div className="small-avatar">
              <img src={logo} alt="QuranBot" />
            </div>
            <div className="message bot">
              <p>Sedang mencari ayat yang relevan...</p>
            </div>
            <div id="chat-bottom" ref={chatBottomRef} />
          </div>
        )}
      </div>

      <div className="chat-input-box">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ketik pertanyaan tentang ayat Al-Qur’an..."
        />
        <button onClick={sendMessage}>
          <Send size={26} />
        </button>
      </div>
    </section>
  );
}

function ResultCard({
  item,
  index,
  messageIndex,
  addBookmark,
  openSurahFromResult,
}) {
  return (
    <div className="result-card">
      <div className="rank">{index + 1}</div>

      <div className="result-content">
        <div className="result-meta">
          <h3>
            QS. {item.nama_surah}: {item.nomor_ayat}
          </h3>

          <div className="score-box">
            <span>Skor</span>
            <strong>{Number(item.similarity_score).toFixed(2)}</strong>
          </div>
        </div>

        <div className="arabic-box">
          <p lang="ar" dir="rtl" translate="no">
            {item.ayat_arab}
          </p>
          <button onClick={() => addBookmark(item)}>
            <Bookmark size={24} />
          </button>
        </div>

        <p className="translation">{item.terjemahan}</p>

        {openSurahFromResult && (
          <div className="result-actions">
            <button onClick={() => openSurahFromResult(item, messageIndex)}>
             Lihat di Surah
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SurahPage({
  selectedSurah,
  setSelectedSurah,
  highlightAyat,
  setHighlightAyat,
  backToChatQuestion,
}) {
  const [surahList, setSurahList] = useState([]);
  const [search, setSearch] = useState("");
  const [surahDetail, setSurahDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  React.useEffect(() => {
    fetch(`${API_URL}/surah`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setSurahList(data.results);
        }
      });
  }, []);

  React.useEffect(() => {
    if (!selectedSurah) return;

    const fetchDetail = async () => {
      setLoadingDetail(true);

      try {
        const res = await fetch(`${API_URL}/surah/${selectedSurah}`);
        const data = await res.json();

        if (data.status === "success") {
          setSurahDetail(data);

          setTimeout(() => {
            if (highlightAyat) {
              const el = document.getElementById(`ayat-${highlightAyat}`);
              if (el) {
                el.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
              }
            }
          }, 500);
        }
      } catch {
        console.error("Gagal mengambil detail surah");
      } finally {
        setLoadingDetail(false);
      }
    };

    fetchDetail();
  }, [selectedSurah, highlightAyat]);

  const openSurah = (nomorSurah) => {
    setHighlightAyat(null);
    setSelectedSurah(nomorSurah);
  };

  const filteredSurah = surahList.filter((surah) =>
    surah.nama_surah.toLowerCase().includes(search.toLowerCase())
  );

if (selectedSurah && surahDetail) {
  return (
    <section className="detail-surah-page">
      <div className="detail-action-bar">
        <button
          className="back-button"
          onClick={() => {
            setSelectedSurah(null);
            setSurahDetail(null);
            setHighlightAyat(null);
          }}
        >
          ← Kembali ke Daftar Surah
        </button>

        <button className="back-chat-button" onClick={backToChatQuestion}>
          ← Kembali ke Chat
        </button>
      </div>

        <div className="detail-surah-header">
          <img src={logo} alt="QuranBot Logo" />

          <div>
            <h1>{surahDetail.surah_info.nama_surah}</h1>
            <p>
              Surah ke-{surahDetail.surah_info.nomor_surah}
              <span>•</span>
              {surahDetail.surah_info.total_ayat} Ayat
            </p>
          </div>
        </div>

        <div className="ayat-section-title">
          Ayat dalam Surah {surahDetail.surah_info.nama_surah}
        </div>

        <div className="ayat-list">
          {surahDetail.verses.map((verse) => (
            <div
              id={`ayat-${verse.nomor_ayat}`}
              className={`ayat-card ${
                highlightAyat === verse.nomor_ayat ? "highlight-ayat" : ""
              }`}
              key={verse.nomor_ayat}
            >
              <div className="ayat-number">{verse.nomor_ayat}</div>

              <div className="ayat-content">
                <p className="ayat-arab" lang="ar" dir="rtl" translate="no">
                  {verse.ayat_arab}
                </p>

                <p className="ayat-translation">{verse.terjemahan}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="surah-page">
      <div className="surah-header">
        <img src={logo} alt="QuranBot Logo" className="surah-logo" />

        <div>
          <h1>QuranBot</h1>
          <p>Pencarian Surah Al-Qur’an</p>
        </div>
      </div>

      <div className="surah-search-box">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama surah... (contoh: Al-Baqarah, Yasin, Ar-Rahman)"
        />

        <button>Cari</button>
      </div>

      <div className="surah-title">
        <h2>Daftar Surah</h2>
        <p>Menampilkan semua surah dalam Al-Qur’an</p>
      </div>

      <div className="surah-table">
        <div className="surah-table-head">
          <span>No.</span>
          <span>Nama Surah</span>
          <span>Total Ayat</span>
          <span>Aksi</span>
        </div>

        <div className="surah-table-body">
          {filteredSurah.map((surah) => (
            <div className="surah-row" key={surah.nomor_surah}>
              <span>{String(surah.nomor_surah).padStart(2, "0")}</span>
              <span>{surah.nama_surah}</span>
              <span>{surah.total_ayat} ayat</span>

              <button onClick={() => openSurah(surah.nomor_surah)}>
                Tampilkan Surah
              </button>
            </div>
          ))}
        </div>
      </div>

      {loadingDetail && <p style={{ marginTop: 20 }}>Memuat surah...</p>}
    </section>
  );
}

function BookmarkPage({ bookmarks, removeBookmark, openSurahFromResult }) {
  const [search, setSearch] = useState("");

  const filteredBookmarks = bookmarks.filter((item) => {
    const keyword = search.toLowerCase();

    return (
      item.nama_surah.toLowerCase().includes(keyword) ||
      item.terjemahan.toLowerCase().includes(keyword) ||
      String(item.nomor_ayat).includes(keyword)
    );
  });

  return (
    <section className="bookmark-page">
      <div className="bookmark-header">
        <Bookmark size={48} />
        <div>
          <h1>Bookmark</h1>
          <p>Kumpulan ayat yang Anda simpan</p>
        </div>
      </div>

      <div className="bookmark-filter">
        <div className="bookmark-search">
          <Search size={22} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari bookmark... (contoh: sabar, rezeki, ujian)"
          />
        </div>

        <select>
          <option>Semua Surah</option>
        </select>
      </div>

      {filteredBookmarks.length === 0 ? (
        <div className="empty-bookmark">
          <Bookmark size={32} />
          <h3>Belum ada bookmark</h3>
          <p>Simpan ayat dari hasil chatbot untuk melihatnya di sini.</p>
        </div>
      ) : (
        <div className="bookmark-list-new">
          {filteredBookmarks.map((item) => (
            <div
              className="bookmark-card-new"
              key={`${item.nomor_surah}-${item.nomor_ayat}`}
            >
              <div className="bookmark-left">
                <img src={logo} alt="QuranBot Logo" />

                <button
                  className="bookmark-star"
                  onClick={() => openSurahFromResult(item)}
                  title="Lihat di Surah"
                >
                  <Star size={20} />
                </button>
              </div>

              <div className="bookmark-info">
                <h3>
                  QS. {item.nama_surah}: {item.nomor_ayat}
                </h3>
              </div>

              <div className="bookmark-content">
                <p className="bookmark-arab" lang="ar" dir="rtl" translate="no">
                  {item.ayat_arab}
                </p>

                <p className="bookmark-translation">{item.terjemahan}</p>
              </div>

              <button
                className="delete-bookmark"
                onClick={() => removeBookmark(item)}
                title="Hapus Bookmark"
              >
                <Trash2 size={22} />
              </button>
            </div>
          ))}

          <div className="bookmark-footer-note">
            <Bookmark size={24} />
            <p>Itu semua bookmark Anda.</p>
            <span>Terus jelajahi dan simpan ayat yang bermanfaat.</span>
          </div>
        </div>
      )}
    </section>
  );
}
function HistoryPage({ searchHistory, setInput, setActiveMenu }) {
  return (
    <section className="history-page">
      <div className="history-header">
        <History size={48} />
        <div>
          <h1>Riwayat Pencarian</h1>
          <p>Daftar pertanyaan yang pernah Anda cari</p>
        </div>
      </div>

      {searchHistory.length === 0 ? (
        <div className="empty-history">
          <History size={32} />
          <h3>Belum ada riwayat pencarian</h3>
          <p>Pertanyaan yang Anda kirim akan muncul di halaman ini.</p>
        </div>
      ) : (
        <div className="history-list">
          {searchHistory.map((item, index) => (
            <div className="history-card" key={index}>
              <div>
                <h3>{item.query}</h3>
                <p>{item.time}</p>
              </div>

              <button
                onClick={() => {
                  setInput(item.query);
                  setActiveMenu("chat");
                }}
              >
                Gunakan Lagi
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function AboutPage() {
  return (
    <section className="about-page">
      <div className="about-hero">
        <div>
          <h1>
            Tentang <span>QuranBot</span>
          </h1>
          <p className="about-subtitle">Pencarian Ayat Al-Qur’an</p>

          <p>
            QuranBot adalah aplikasi pencarian ayat Al-Qur’an yang dirancang
            untuk membantu pengguna menemukan ayat yang relevan dengan cepat
            dan mudah.
          </p>

          <p>
            Aplikasi ini menyediakan fitur pencarian ayat menggunakan semantic
            retrieval untuk memahami makna pertanyaan, pencarian surah, dan
            bookmark ayat pilihan.
          </p>
        </div>

        <img src={logo} alt="QuranBot" />
      </div>

      <h2 className="section-title">Fitur Aplikasi</h2>

      <div className="about-feature-grid">
        <div className="about-feature-card">
          <MessageCircle size={34} />
          <h3>Pencarian Ayat Semantic Retrieval</h3>
          <p>
            Mencari ayat berdasarkan makna atau konteks menggunakan teknologi
            semantic retrieval.
          </p>
        </div>

        <div className="about-feature-card">
          <BookOpen size={34} />
          <h3>Pencarian Surah</h3>
          <p>
            Menampilkan daftar seluruh surah dalam Al-Qur’an beserta ayat di
            dalamnya.
          </p>
        </div>

        <div className="about-feature-card">
          <Bookmark size={34} />
          <h3>Bookmark</h3>
          <p>
            Menyimpan ayat pilihan dari hasil pencarian agar dapat diakses
            kembali.
          </p>
        </div>
      </div>

      <div className="about-info-grid">
        <div className="about-info-card">
          <h3>Informasi Mahasiswa</h3>
          <div className="info-row">
            <span>Nama</span>
            <strong>Muhammad Hafizh Mulyansyah</strong>
          </div>
          <div className="info-row">
            <span>NIM</span>
            <strong>535220229</strong>
          </div>
          <div className="info-row">
            <span>Jurusan</span>
            <strong>Teknik Informatika</strong>
          </div>
        </div>

        <div className="about-info-card">
          <h3>Informasi Akademik</h3>
          <div className="info-row">
            <span>Institusi</span>
            <strong>Universitas Tarumanagara</strong>
          </div>
          <div className="info-row">
            <span>Fakultas</span>
            <strong>Teknologi Informasi</strong>
          </div>
          <div className="info-row">
            <span>Dosen Pembimbing</span>
            <strong>Tri Sutrisno, S.Si., M.Sc.</strong>
          </div>
        </div>
      </div>

      <div className="about-bottom-grid">
        <div className="about-description-card">
          <h2>
            Implementasi Chatbot Eksplorasi Ayat Al-Qur&apos;an berbasis
            semantic retrieval menggunakan sentence transformer
          </h2>

          <p>
            QuranBot dikembangkan sebagai bagian dari penelitian untuk membangun
            chatbot yang mampu menemukan ayat Al-Qur’an berdasarkan kemiripan
            makna pertanyaan pengguna.
          </p>

          <p>
            Sistem memanfaatkan <strong>Semantic Retrieval</strong> dengan model{" "}
            <strong>Sentence Transformer</strong> untuk memahami makna
            pertanyaan dan mencocokkannya dengan terjemahan ayat melalui{" "}
            <strong>Cosine Similarity</strong>.
          </p>

          <p>
            QuranBot juga dilengkapi <strong>Semantic Guardrails</strong> untuk
            memfilter pertanyaan yang tidak pantas, ambigu, atau berada di luar
            konteks penggunaan.
          </p>

          <p>
            Sistem ini berfungsi sebagai alat bantu eksplorasi ayat, bukan
            sebagai pengganti tafsir, fatwa, atau rujukan keagamaan resmi.
          </p>
        </div>

        <div className="tech-card">
          <h3>Teknologi yang Digunakan</h3>

          <div className="tech-item">
            <strong>Sentence Transformer</strong>
            <span>paraphrase-multilingual-MiniLM-L12-v2</span>
          </div>

          <div className="tech-item">
            <strong>Cosine Similarity</strong>
            <span>Mengukur kemiripan antara pertanyaan dan ayat</span>
          </div>

          <div className="tech-item">
            <strong>Semantic Guardrails</strong>
            <span>Validasi input agar sistem tetap sesuai batasan</span>
          </div>

          <div className="tech-item">
            <strong>Python</strong>
            <span>Bahasa pemrograman utama backend</span>
          </div>

          <div className="tech-item">
            <strong>React</strong>
            <span>Library untuk antarmuka pengguna</span>
          </div>
        </div>
      </div>

      <div className="about-quote">
        “Dan sesungguhnya telah Kami mudahkan Al-Qur’an untuk pelajaran, maka
        adakah orang yang mengambil pelajaran?” <br />
        <strong>QS. Al-Qamar: 17</strong>
      </div>
    </section>
  );
}