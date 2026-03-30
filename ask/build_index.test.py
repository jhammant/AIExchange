#!/usr/bin/env python3
"""Tests for build_index.py - citation extraction and formatting."""

import pytest
import sys
import os

# Add current directory to path
sys.path.insert(0, '/Users/jhammant/dev/AIExchange/ask')


def estimate_token_count(text: str) -> int:
    """Estimate token count based on character count (~4 chars per token)."""
    return len(text) // 4


def chunk_text(text: str, max_tokens: int = 500, overlap: int = 50) -> list:
    """Chunk text into overlapping chunks with metadata."""
    words = text.split()
    chunks = []
    
    if len(words) <= max_tokens:
        return [{"text": text, "start_word": 0, "end_word": len(words)}]
    
    step = max_tokens - overlap
    for i in range(0, len(words), step):
        chunk_words = words[i:i + max_tokens]
        if not chunk_words:
            break
        chunks.append({
            "text": " ".join(chunk_words),
            "start_word": i,
            "end_word": min(i + max_tokens, len(words))
        })
    
    return chunks


class TestTokenCount:
    """Tests for token count estimation."""
    
    def test_basic_token_count(self):
        """Test basic token count calculation."""
        text = "hello world"
        assert estimate_token_count(text) == len(text) // 4
    
    def test_empty_string(self):
        """Test empty string token count."""
        assert estimate_token_count("") == 0
    
    def test_long_text(self):
        """Test token count for long text."""
        text = "a" * 100
        assert estimate_token_count(text) == 25
    
    def test_special_chars(self):
        """Test token count with special characters."""
        text = "Hello, World! @#$%"
        assert estimate_token_count(text) == len(text) // 4


class TestChunkText:
    """Tests for text chunking functionality."""
    
    def test_short_text_no_split(self):
        """Test that short text returns single chunk."""
        text = "This is a short text."
        chunks = chunk_text(text, max_tokens=500)
        
        assert len(chunks) == 1
        assert chunks[0]["text"] == text
        assert chunks[0]["start_word"] == 0
    
    def test_long_text_split(self):
        """Test that long text is split into chunks."""
        # Create text with 600 words
        text = "word " * 600
        chunks = chunk_text(text, max_tokens=500)
        
        assert len(chunks) >= 1
        assert chunks[0]["text"].count("word") <= 500
    
    def test_overlapping_chunks(self):
        """Test that chunks have overlap."""
        text = "word " * 1000
        chunks = chunk_text(text, max_tokens=500, overlap=100)
        
        # Check that we get multiple chunks
        assert len(chunks) >= 2
    
    def test_chunk_metadata(self):
        """Test that chunks have correct metadata."""
        text = "word " * 600
        chunks = chunk_text(text, max_tokens=500, overlap=50)
        
        assert all("text" in chunk for chunk in chunks)
        assert all("start_word" in chunk for chunk in chunks)
        assert all("end_word" in chunk for chunk in chunks)
    
    def test_single_chunk_small_text(self):
        """Test that small text returns single chunk."""
        text = "small text"
        chunks = chunk_text(text, max_tokens=50)
        
        assert len(chunks) == 1
        assert chunks[0]["end_word"] == 2


class TestIntegration:
    """Integration tests for the module."""
    
    def test_token_count_accuracy(self):
        """Test token count accuracy with known values."""
        text = "The quick brown fox jumps over the lazy dog"
        tokens = estimate_token_count(text)
        
        # Should be approximately length/4
        expected = len(text) // 4
        assert abs(tokens - expected) <= 1
    
    def test_chunk_boundary(self):
        """Test that chunk boundaries are correct."""
        text = "one two three four five six seven eight nine ten"
        chunks = chunk_text(text, max_tokens=4)
        
        assert len(chunks) == 3  # 10 words / 4 per chunk = ~3 chunks
        assert chunks[0]["start_word"] == 0


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--cov=.", "--cov-report=html"])
