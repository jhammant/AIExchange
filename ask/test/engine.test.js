import { describe, it, expect } from 'vitest'

describe('Citation Extraction Tests', () => {
  const mockSources = [{
    video_id: '_tHHzkkvgHc',
    title: 'Beyond LLMOps',
    channel: 'The Exchange',
    timestamp: '12:34',
    youtube_url: 'https://youtu.be/_tHHzkkvgHc?t=754',
    relevance_score: 0.87
  }]

  const mockAnswer = `Based on the context, enterprise AI adoption is accelerating with HTTPI frameworks.

Key trends include:
1. Cloud-native deployments
2. Hybrid local + Kubernetes environments`

  describe('extractTimestamp', () => {
    it('should extract mm:ss format from timestamp string', () => {
      const result = extractTimestamp('12:34')
      expect(result).toBe('12:34')
    })

    it('should handle timestamp with seconds only', () => {
      const result = extractTimestamp(754)
      expect(result).toBe('12:34')
    })

    it('should return default for null input', () => {
      const result = extractTimestamp(null)
      expect(result).toBe('00:00')
    })
  })

  describe('parseYouTubeUrl', () => {
    it('should extract video ID from youtu.be URL', () => {
      const result = parseYouTubeUrl('https://youtu.be/_tHHzkkvgHc')
      expect(result).toBe('_tHHzkkvgHc')
    })

    it('should extract video ID from youtube.com watch URL', () => {
      const result = parseYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
      expect(result).toBe('dQw4w9WgXcQ')
    })

    it('should handle URL with timestamp parameter', () => {
      const result = parseYouTubeUrl('https://youtu.be/_tHHzkkvgHc?t=754')
      expect(result).toBe('_tHHzkkvgHc')
    })

    it('should return empty string for invalid URL', () => {
      const result = parseYouTubeUrl('not-a-url')
      expect(result).toBe('')
    })
  })

  describe('formatAnswer', () => {
    it('should convert **bold** to <strong>', () => {
      const result = formatAnswer('This is **important**')
      expect(result).toContain('<strong>important</strong>')
    })

    it('should convert *italic* to <em>', () => {
      const result = formatAnswer('This is *important*')
      expect(result).toContain('<em>important</em>')
    })

    it('should escape HTML special characters', () => {
      const result = formatAnswer('<script>alert("xss")</script>')
      expect(result).not.toContain('<script>')
      expect(result).toContain('&lt;')
    })

    it('should convert newlines to <br>', () => {
      const result = formatAnswer('line1\nline2')
      expect(result).toContain('<br>')
    })
  })

  describe('processEngineOutput', () => {
    it('should process valid answer with sources', () => {
      const input = { question: 'What are key trends?', answer: mockAnswer, sources: mockSources }
      const result = processEngineOutput(input)
      
      expect(result).toHaveProperty('question')
      expect(result).toHaveProperty('answer')
      expect(result.sources.length).toBe(1)
      expect(result.citations.length).toBe(1)
    })

    it('should handle answer without sources', () => {
      const input = { question: 'What is AI?', answer: 'AI is artificial intelligence', sources: [] }
      const result = processEngineOutput(input)
      
      expect(result.sources.length).toBe(0)
      expect(result.citations.length).toBe(0)
    })

    it('should generate citations from sources', () => {
      const input = { question: 'Test', answer: mockAnswer, sources: mockSources }
      const result = processEngineOutput(input)
      
      expect(result.citations).toHaveLength(1)
      expect(result.citations[0]).toContain('Beyond LLMOps')
    })

    it('should handle missing answer property', () => {
      const input = { question: 'Test' }
      const result = processEngineOutput(input)
      expect(result.answer).toBe('')
    })

    it('should handle null sources array', () => {
      const input = { question: 'Test', answer: 'Test', sources: null }
      const result = processEngineOutput(input)
      expect(result.sources).toEqual([])
    })

    it('should handle multiple sources', () => {
      const multiSources = [...mockSources, {
        video_id: '_z_Y7IUxXHU',
        title: 'From Zero to Observable',
        channel: 'The Exchange',
        timestamp: '05:21',
        youtube_url: 'https://youtu.be/_z_Y7IUxXHU?t=321',
        relevance_score: 0.82
      }]
      
      const input = { question: 'Test', answer: mockAnswer, sources: multiSources }
      const result = processEngineOutput(input)
      
      expect(result.sources.length).toBe(2)
      expect(result.citations).toHaveLength(2)
    })
  })

  describe('Integration Tests', () => {
    const fullResponse = {
      question: 'What are the key trends in enterprise AI adoption?',
      answer: mockAnswer,
      sources: [{
        video_id: '_tHHzkkvgHc',
        title: 'Beyond LLMOps',
        channel: 'The Exchange',
        timestamp: '12:34',
        youtube_url: 'https://youtu.be/_tHHzkkvgHc?t=754',
        relevance_score: 0.87
      }],
      retrieved_chunks: 8
    }

    it('should process full engine response', () => {
      const result = processEngineOutput(fullResponse)
      
      expect(result.question).toBe(fullResponse.question)
      expect(result.sources.length).toBe(1)
      expect(result.citations[0]).toContain('Beyond LLMOps')
    })
  })
})

// Helper functions
function extractTimestamp(input) {
  if (!input) return '00:00'
  if (typeof input === 'string' && input.includes(':')) return input
  const seconds = parseInt(input) || 0
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function parseYouTubeUrl(url) {
  if (!url || typeof url !== 'string') return ''
  const match = url.match(/youtu\.be\/([^\?&#]+)|watch\?v=([^\?&#]+)/)
  return match ? (match[1] || match[2]) : ''
}

function formatAnswer(text) {
  return String(text)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
}

function processEngineOutput(input) {
  const result = {
    question: input.question || '',
    answer: input.answer || '',
    sources: input.sources || [],
    citations: []
  }
  
  if (result.sources && Array.isArray(result.sources)) {
    result.citations = result.sources.map(source => {
      const timestamp = extractTimestamp(source.timestamp || '')
      let youtubeUrl = source.youtube_url || ''
      if (!youtubeUrl && source.video_id) {
        const tsParts = timestamp.split(':')
        const totalSeconds = parseInt(tsParts[0]) * 60 + parseInt(tsParts[1] || '0')
        youtubeUrl = `https://youtu.be/${source.video_id}?t=${totalSeconds}`
      }
      
      const title = source.title || 'Unknown'
      return `${title} ( YouTube: ${youtubeUrl}, timestamp: ${timestamp} )`
    })
  }
  
  return result
}
