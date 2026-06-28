import pandas as pd
import numpy as np


# DATA HASIL VALIDASI PAKAR
data = [
    {
        "query": "Kenapa Allah disebut sebagai Tuhan pencipta alam",
        "TP": 4,
        "FP": 1,
        "rank_relevan_pertama": 1
    },
    {
        "query": "Ayat pentingnya sabar ketika mendapat ujian",
        "TP": 5,
        "FP": 0,
        "rank_relevan_pertama": 1
    },
    {
        "query": "Ayat tentang sedekah dan membantu orang miskin",
        "TP": 5,
        "FP": 0,
        "rank_relevan_pertama": 1
    },
    {
        "query": "Ayat yang menjelaskan sholat",
        "TP": 5,
        "FP": 0,
        "rank_relevan_pertama": 1
    },
    {
        "query": "Ayat yang menjelaskan bahwa Allah Maha Pengampun",
        "TP": 4,
        "FP": 1,
        "rank_relevan_pertama": 1
    },
    {
        "query": "Kenapa Al-Qur'an diturunkan kepada Nabi Muhammad",
        "TP": 4,
        "FP": 1,
        "rank_relevan_pertama": 1
    },
    {
        "query": "Kenapa Allah sayang kepada hamba-hambanya",
        "TP": 3,
        "FP": 2,
        "rank_relevan_pertama": 1
    },
    {
        "query": "Ayat yang menjelaskan larangan zina",
        "TP": 3,
        "FP": 2,
        "rank_relevan_pertama": 1
    },
    {
        "query": "Cari ayat tentang janji Allah bagi orang beriman",
        "TP": 4,
        "FP": 1,
        "rank_relevan_pertama": 2
    },
    {
        "query": "Ayat yang menjelaskan bahwa Allah mengetahui isi hati manusia",
        "TP": 5,
        "FP": 0,
        "rank_relevan_pertama": 1
    },
]

df = pd.DataFrame(data)


# HITUNG PRECISION@5

df["Precision@5"] = df["TP"] / (df["TP"] + df["FP"])

# HITUNG MRR
# Reciprocal Rank = 1 / rank relevan pertama

df["Reciprocal_Rank"] = 1 / df["rank_relevan_pertama"]

mean_precision = df["Precision@5"].mean()
mrr = df["Reciprocal_Rank"].mean()

# OUTPUT

print("===== HASIL EVALUASI RETRIEVAL BERDASARKAN VALIDASI PAKAR =====")
print(f"Precision@5 : {mean_precision:.4f}")
print(f"MRR         : {mrr:.4f}")

print("\n===== DETAIL HASIL =====")
print(df)

df.to_csv(
    "hasil_evaluasi_precision_mrr_pakar.csv",
    index=False,
    encoding="utf-8-sig"
)

print("\nFile berhasil disimpan: hasil_evaluasi_precision_mrr_pakar.csv")