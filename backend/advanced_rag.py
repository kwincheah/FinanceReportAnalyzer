"""
Advanced 4-Stage Financial RAG Engine:
Stage 1: Hierarchical Parent-Child AST Chunking
Stage 2: Hybrid Search (BM25 Sparse + ChromaDB Dense) via Reciprocal Rank Fusion (RRF)
Stage 3: Cross-Encoder Reranking via FlashRank (local 15ms ONNX model)
Stage 4: Contextual Compression with Source Page Citation
"""

import chromadb
from rank_bm25 import BM25Okapi
from flashrank import Ranker, RerankRequest
from typing import List, Dict, Optional
from pydantic import BaseModel
import os


class ChildChunk(BaseModel):
    chunk_id: str
    parent_id: str
    parent_heading: str
    text: str


class ParentChunk(BaseModel):
    parent_id: str
    heading: str
    full_text: str


class AdvancedFinancialRAG:
    def __init__(self, collection_name: str = "bursa_hierarchical_notes"):
        # 1. Dense Vector Engine
        self.chroma_client = chromadb.Client()
        self.collection = self.chroma_client.get_or_create_collection(name=collection_name)
        
        # 2. Local Cross-Encoder Reranker (Runs via ONNX on CPU in ~15ms)
        try:
            self.reranker = Ranker(model_name="ms-marco-TinyBERT-L-2-v2")
        except Exception as e:
            print(f"Warning initializing FlashRank model: {e}. Falling back to default ranker.")
            self.reranker = Ranker()
        
        # 3. Document Storage for Hierarchical & Sparse Retrieval
        self.parents: Dict[str, ParentChunk] = {}
        self.children: List[ChildChunk] = []
        self.bm25_corpus: List[List[str]] = []
        self.bm25_index: Optional[BM25Okapi] = None

    def index_document_hierarchical(self, stock_code: str, sections: List[Dict]):
        """
        Stage 1: Indexes Parent sections and breaks them into Child paragraphs.
        """
        for s_idx, sec in enumerate(sections):
            p_id = f"{stock_code}_p_{s_idx}"
            heading = sec.get("heading", "Note")
            full_text = sec.get("full_text", "")

            self.parents[p_id] = ParentChunk(parent_id=p_id, heading=heading, full_text=full_text)

            # Split parent section into child paragraphs
            paragraphs = [p.strip() for p in full_text.split("\n\n") if len(p.strip()) > 20]
            if not paragraphs and full_text.strip():
                paragraphs = [full_text.strip()]

            for c_idx, para in enumerate(paragraphs):
                c_id = f"{p_id}_c_{c_idx}"
                child = ChildChunk(chunk_id=c_id, parent_id=p_id, parent_heading=heading, text=para)
                
                # Check if child already in self.children
                existing_idx = next((i for i, c in enumerate(self.children) if c.chunk_id == c_id), None)
                if existing_idx is not None:
                    self.children[existing_idx] = child
                else:
                    self.children.append(child)

                # Upsert to ChromaDB Dense Index
                self.collection.upsert(
                    documents=[para],
                    metadatas=[{"stock_code": stock_code, "parent_id": p_id, "heading": heading}],
                    ids=[c_id]
                )

        # Build BM25 Sparse Index on all Child Chunks
        self.bm25_corpus = [child.text.lower().split() for child in self.children]
        if self.bm25_corpus:
            self.bm25_index = BM25Okapi(self.bm25_corpus)

    def search_hybrid_and_rerank(self, stock_code: str, query: str, top_k: int = 3) -> List[Dict]:
        """
        Stage 2 (Hybrid RRF) + Stage 3 (Cross-Encoder Rerank) + Stage 4 (Compression)
        """
        if not self.children:
            return []

        # --- Channel A: Dense Vector Search ---
        dense_ids = []
        try:
            dense_results = self.collection.query(
                query_texts=[query],
                n_results=min(10, len(self.children)),
                where={"stock_code": stock_code}
            )
            if dense_results and "ids" in dense_results and dense_results["ids"]:
                dense_ids = dense_results["ids"][0]
        except Exception as e:
            print(f"ChromaDB search warning: {e}")

        # --- Channel B: BM25 Sparse Search ---
        query_tokens = query.lower().split()
        sparse_ids = []
        if self.bm25_index and self.bm25_corpus:
            bm25_scores = self.bm25_index.get_scores(query_tokens)
            top_sparse_indices = sorted(range(len(bm25_scores)), key=lambda i: bm25_scores[i], reverse=True)[:10]
            sparse_ids = [
                self.children[i].chunk_id 
                for i in top_sparse_indices 
                if bm25_scores[i] > 0 and self.children[i].chunk_id.startswith(f"{stock_code}_")
            ]

        # --- Reciprocal Rank Fusion (RRF) ---
        rrf_scores = {}
        for rank, cid in enumerate(dense_ids):
            rrf_scores[cid] = rrf_scores.get(cid, 0.0) + (1.0 / (60 + rank))
        for rank, cid in enumerate(sparse_ids):
            rrf_scores[cid] = rrf_scores.get(cid, 0.0) + (1.0 / (60 + rank))

        # Fallback: If no matches, pull candidates matching stock_code
        if not rrf_scores:
            stock_children = [c.chunk_id for c in self.children if c.chunk_id.startswith(f"{stock_code}_")]
            candidate_child_ids = stock_children[:10]
        else:
            candidate_child_ids = sorted(rrf_scores.keys(), key=lambda x: rrf_scores[x], reverse=True)[:15]

        # Prepare candidates for Stage 3 Cross-Encoder
        passages = []
        child_map = {c.chunk_id: c for c in self.children}
        for cid in candidate_child_ids:
            if cid in child_map:
                c = child_map[cid]
                passages.append({
                    "id": cid,
                    "text": c.text,
                    "meta": {"parent_id": c.parent_id, "heading": c.parent_heading}
                })

        if not passages:
            return []

        # --- Stage 3: Cross-Encoder Reranker ---
        try:
            rerank_req = RerankRequest(query=query, passages=passages)
            reranked = self.reranker.rerank(rerank_req)
            top_candidates = reranked[:top_k]
        except Exception as e:
            print(f"FlashRank warning: {e}. Falling back to RRF ordering.")
            top_candidates = passages[:top_k]
            for item in top_candidates:
                item["score"] = rrf_scores.get(item["id"], 0.5)

        # --- Stage 4: Hierarchical Parent Context Injection & Compression ---
        final_evidence = []
        for item in top_candidates:
            meta = item.get("meta", {})
            p_id = meta.get("parent_id", "")
            heading = meta.get("heading", "Notes")
            parent_text = self.parents[p_id].full_text if p_id in self.parents else item.get("text", "")

            try:
                score = round(float(item.get("score", 0.0)), 4)
            except Exception:
                score = 0.0


            matched_text = item.get("text", "")
            parent_snippet = parent_text[:500] + ("..." if len(parent_text) > 500 else "")

            final_evidence.append({
                "section": heading,
                "score": score,
                "matched_paragraph": matched_text,
                "parent_context": parent_snippet
            })

        return final_evidence
