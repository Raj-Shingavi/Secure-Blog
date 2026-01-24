from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import re

def calculate_plagiarism_score(new_text, existing_texts):
    """
    Calculates the maximum similarity score between new_text and a list of existing_texts.
    Returns: similarity percentage (0-100)
    """
    if not existing_texts:
        return 0.0
    
    # Add the new text to the corpus to vectorize
    corpus = [new_text] + existing_texts
    
    vectorizer = TfidfVectorizer().fit_transform(corpus)
    vectors = vectorizer.toarray()
    
    # Calculate cosine similarity between the new text (index 0) and all others
    if len(vectors) > 1:
        similarities = cosine_similarity([vectors[0]], vectors[1:])
        max_similarity = np.max(similarities)
        return round(max_similarity * 100, 2)
    
    return 0.0

def estimate_ai_probability(text):
    """
    Estimates the probability that text is AI-generated using heuristic features.
    NOTE: This is a simplified heuristic simulator, not a trained LLM detector.
    
    Heuristics used:
    1. Sentence length variance (AI tends to have more uniform sentence lengths).
    2. Common word usage (AI uses common words more frequently, lower perplexity simulator).
    """
    if not text:
        return 0
        
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if s.strip()]
    
    if len(sentences) < 3:
        return 10 # Not enough unique data, assume low
        
    # 1. Sentence Length Variance (Lower variance -> Higher AI probability)
    lengths = [len(s.split()) for s in sentences]
    variance = np.var(lengths) if lengths else 0
    
    # Normalizing variance: 0 variance (very machine-like) -> 100 score. 
    # High variance (human-like) -> 0 score.
    # Assume distinct variance > 50 is very human.
    variance_score = max(0, 100 - (variance * 2)) 
    
    # 2. Burstiness / Complexity simulator (Placeholder)
    # We'll stick to variance for this simple version + a random factor based on word types
    # Real implementation needs a model.
    
    # Combined score (weighted)
    final_score = min(95, max(5, variance_score)) 
    
    return int(final_score)
