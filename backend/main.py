from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer

app = FastAPI(title="Chatbot Al-Quran API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Model
model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")

# Load Data
df_alquran = pd.read_csv(
    "data/Al-Quran.csv",
    sep=",",
    encoding="utf-8-sig"
)
df_guardrails = pd.read_csv("data/Semantic_Guardrails.csv", encoding="utf-8-sig")

alquran_embeddings = np.load("data/alquran_embeddings.npy")
guardrails_embeddings = np.load("data/guardrails_embeddings.npy")


class ChatRequest(BaseModel):
    message: str



# Helper
def cosine_similarity(query_embedding, embeddings):
    return np.dot(embeddings, query_embedding)


def contains_blocked_keyword(text):
    text = text.lower()

    blocked_keywords = [
        "anjing", "babi", "tolol", "goblok", "bodoh",
        "bangsat", 
    ]

    return any(word in text for word in blocked_keywords)


def is_general_out_of_scope(text):
    text = text.lower().strip()

    quran_terms = [
        "alquran", "al-quran", "quran", "ayat", "surah",
        "nabi", "rasul", "allah", "islam", "iman", "dosa",
        "pahala", "surga", "neraka", "sholat", "salat",
        "zakat", "sedekah", "sabar", "taubat", "doa",
        "musibah", "ujian", "cobaan", "bersyukur", "beriman",
        "hati", "tenang", "gelisah", "takut", "ampunan"
    ]

    general_patterns = [
        "apa itu", "jelaskan apa itu", "pengertian", "definisi"
    ]

    is_general = any(text.startswith(p) for p in general_patterns)
    has_quran_context = any(term in text for term in quran_terms)

    return is_general and not has_quran_context


def clean_query(text):
    stopwords = [
        "apa", "itu", "kenapa", "mengapa", "bagaimana",
        "yang", "dan", "di", "ke", "dari", "tentang",
        "adalah", "dengan", "untuk", "dong", "tolong",
        "cari", "carikan", "ayat", "menjelaskan", "jelaskan"
    ]

    words = text.lower().split()
    filtered = [w for w in words if w not in stopwords]

    cleaned = " ".join(filtered)
    return cleaned if cleaned else text


def enrich_query(text):
    synonyms = {
        "sabar": ["kesabaran", "tabah", "ujian", "musibah", "cobaan"],
        "kesabaran": ["sabar", "tabah", "ujian", "musibah", "cobaan"],
        "tabah": ["sabar", "kesabaran", "ujian", "musibah"],
        "ujian": ["cobaan", "musibah", "sabar", "kesabaran"],
        "cobaan": ["ujian", "musibah", "sabar", "kesabaran"],
        "musibah": ["ujian", "cobaan", "sabar", "kesabaran"],

        "sedekah": ["zakat", "infak", "memberi", "harta"],
        "zakat": ["sedekah", "infak", "memberi"],
        "infak": ["sedekah", "zakat", "memberi"],

        "sholat": ["salat", "ibadah", "doa"],
        "salat": ["sholat", "ibadah", "doa"],

        "dosa": ["maksiat", "kesalahan", "ampunan", "taubat"],
        "taubat": ["ampunan", "bertaubat", "dosa"],
        "ampunan": ["taubat", "dosa", "rahmat"],

        "takut": ["cemas", "khawatir", "gelisah"],
        "cemas": ["takut", "khawatir", "gelisah", "tenang"],
        "gelisah": ["cemas", "takut", "tenang", "hati"],
        "tenang": ["ketenangan", "hati", "damai"],

        "bersyukur": ["syukur", "nikmat"],
        "syukur": ["bersyukur", "nikmat"],

        "nabi": ["rasul", "kisah"],
        "muhammad": ["nabi", "rasul"],
        "musa": ["nabi", "rasul", "kisah"],
    }

    extra = []

    for key, values in synonyms.items():
        if key in text:
            extra.extend(values)

    enriched = text + " " + " ".join(extra)
    return enriched.strip()



# Semantic Guardrails

def check_guardrails(user_message, threshold=0.85):
    query_embedding = model.encode(
        user_message,
        convert_to_numpy=True,
        normalize_embeddings=True
    )

    scores = cosine_similarity(query_embedding, guardrails_embeddings)
    best_idx = int(np.argmax(scores))
    best_score = float(scores[best_idx])

    matched = df_guardrails.iloc[best_idx]
    category = str(matched["category"]).lower()
    action = str(matched["action"]).lower()

    if best_score < threshold:
        return {
            "status": "allow",
            "score": best_score,
            "query_embedding": query_embedding
        }

    if action == "clarify":
        return {
            "status": "clarify",
            "score": best_score,
            "category": category,
            "message": "Pertanyaan Anda masih belum jelas. Mohon diperjelas agar saya dapat menjawab dengan lebih tepat."
        }

    if action == "block":
        return {
            "status": "block",
            "score": best_score,
            "category": category,
            "message": "Maaf, pertanyaan tersebut kurang pantas atau tidak dapat diproses karena berada di luar batasan sistem."
        }

    return {
        "status": "allow",
        "score": best_score,
        "query_embedding": query_embedding
    }

# Semantic Retrieval Top-5
def retrieve_alquran(query_embedding, top_k=5, min_score=0.50):
    scores = cosine_similarity(query_embedding, alquran_embeddings)

    top_indices = np.argsort(scores)[::-1]

    results = []

    for idx in top_indices:
        score = float(scores[idx])

        if score < min_score:
            continue

        row = df_alquran.iloc[idx]

        results.append({
            "nomor_surah": int(row["nomor_surah"]),
            "nama_surah": str(row["nama_surah"]),
            "nomor_ayat": int(row["nomor_ayat"]),
            "ayat_arab": str(row["ayat_arab"]),
            "terjemahan": str(row["terjemahan"]),
            "similarity_score": score
        })

        if len(results) >= top_k:
            break

    return results

@app.get("/surah")
def get_surah_list():
    surah_df = (
        df_alquran[["nomor_surah", "nama_surah"]]
        .drop_duplicates()
        .sort_values("nomor_surah")
    )

    results = []

    for _, row in surah_df.iterrows():
        total_ayat = len(
            df_alquran[df_alquran["nomor_surah"] == row["nomor_surah"]]
        )

        results.append({
            "nomor_surah": int(row["nomor_surah"]),
            "nama_surah": str(row["nama_surah"]),
            "total_ayat": int(total_ayat)
        })

    return {
        "status": "success",
        "results": results
    }

# Daftar surah
@app.get("/surah/{nomor_surah}")
def get_surah_detail(nomor_surah: int):

    surah_df = (
        df_alquran[df_alquran["nomor_surah"] == nomor_surah]
        .sort_values("nomor_ayat")
    )

    if surah_df.empty:
        return {
            "status": "not_found",
            "message": "Surah tidak ditemukan."
        }

    verses = []

    for _, row in surah_df.iterrows():
        verses.append({
            "nomor_ayat": int(row["nomor_ayat"]),
            "ayat_arab": str(row["ayat_arab"]),
            "terjemahan": str(row["terjemahan"])
        })

    return {
        "status": "success",
        "surah_info": {
            "nomor_surah": int(surah_df.iloc[0]["nomor_surah"]),
            "nama_surah": str(surah_df.iloc[0]["nama_surah"]),
            "total_ayat": len(verses)
        },
        "verses": verses
    }

# Endpoint Chat
@app.post("/chat")
def chat(request: ChatRequest):
    user_message = request.message.strip()

    if not user_message:
        return {
            "status": "error",
            "message": "Pesan tidak boleh kosong."
        }

    if contains_blocked_keyword(user_message):
        return {
            "status": "block",
            "message": "Maaf, pertanyaan tersebut kurang pantas atau tidak dapat diproses.",
            "category": "toxic",
            "score": 1.0
        }

    if is_general_out_of_scope(user_message):
        return {
            "status": "not_found",
            "message": "Maaf, saya hanya dapat membantu pertanyaan yang berkaitan dengan ayat Al-Qur’an."
        }

    cleaned_message = clean_query(user_message)
    enriched_message = enrich_query(cleaned_message)

    guardrail_result = check_guardrails(enriched_message)

    if guardrail_result["status"] == "clarify":
        return {
            "status": "clarify",
            "message": guardrail_result["message"],
            "category": guardrail_result["category"],
            "score": guardrail_result["score"]
        }

    if guardrail_result["status"] == "block":
        return {
            "status": "block",
            "message": guardrail_result["message"],
            "category": guardrail_result["category"],
            "score": guardrail_result["score"]
        }

    query_embedding = guardrail_result["query_embedding"]

    results = retrieve_alquran(
        query_embedding,
        top_k=5,
        min_score=0.50
    )

    if not results:
        return {
            "status": "not_found",
            "message": "Maaf, saya belum menemukan ayat yang cukup relevan dengan pertanyaan tersebut."
        }

    return {
        "status": "allow",
        "type": "semantic_retrieval",
        "message": "Berikut Top-5 ayat yang paling relevan.",
        "query_original": user_message,
        "query_cleaned": cleaned_message,
        "query_enriched": enriched_message,
        "results": results
    }

@app.get("/")
def root():
    return {
        "message": "Chatbot Al-Quran API berjalan."
    }