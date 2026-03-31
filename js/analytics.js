/**
 * AI Exchange Analytics Platform - Comprehensive Content Analysis
 * Static site version for GitHub Pages deployment
 */

const CONFIG = {
    // LLM URL for video analysis - requires local LM Studio running
    llmUrl: 'http://localhost:1234/api/v1/chat',

    // Use mock data for static hosting
    useMockData: true,
};

// Data Store - can be loaded from external JSON in production
const DataStore = {
    videos: [],
    speakers: {},
    topics: {}
};

/**
 * Initialize the analytics platform
 */
async function initApp() {
    console.log('Initializing AI Exchange Analytics Platform...');

    try {
        // Load data
        if (CONFIG.useMockData) {
            loadData();
        }

        // Initialize views
        window.views = {
            dashboard: document.getElementById('dashboard'),
            videos: document.getElementById('videos'),
            speakers: document.getElementById('speakers'),
            topics: document.getElementById('topics')
        };

        // Setup event listeners
        setupEventListeners();

        // Render initial views
        renderDashboard();

    } catch (e) {
        console.error('Initialization error:', e);
    }
}

/**
 * Load sample data
 */
function loadData() {
    // Videos database
    DataStore.videos = [
        {
            id: 'K_bWU7WCj2M',
            title: 'AI Safety & Future of Technology - Expert Panel Discussion',
            channel: 'AI Exchange',
            duration: '1h 45m',
            viewCount: 234567,
            uploadDate: '2024-01-15',
            thumbnail: 'https://img.youtube.com/vi/K_bWU7WCj2M/hqdefault.jpg',
            url: 'https://www.youtube.com/watch?v=K_bWU7WCj2M',
            sentiment: 'positive',
            topics: ['AI Safety', 'Ethics', 'Policy'],
            transcript: 'Welcome to today\'s panel on AI safety. I\'m Dr. Sarah Chen, and we have an incredible lineup of experts.',
            analysis: {
                summary: 'Comprehensive discussion on AI safety challenges, alignment problems, and regulatory frameworks. Experts debate the timing of AGI development and necessary safeguards.',
                mainTopics: ['AI Alignment', 'Regulation', 'Long-term Safety'],
                sentiment: 'positive',
                keyQuotes: ['We must start thinking about alignment before systems become superintelligent']
            }
        },
        {
            id: 'YjheR847GbA',
            title: 'Deep Learning Neural Network Architectures Explained',
            channel: 'AI Exchange',
            duration: '52m',
            viewCount: 187234,
            uploadDate: '2024-01-22',
            thumbnail: 'https://img.youtube.com/vi/YjheR847GbA/hqdefault.jpg',
            url: 'https://www.youtube.com/watch?v=YjheR847GbA',
            sentiment: 'positive',
            topics: ['Neural Networks', 'Deep Learning', 'Architecture'],
            transcript: 'Good morning everyone. Today we will explore neural network architectures.',
            analysis: {
                summary: 'Comprehensive guide to modern neural network architectures including transformers and attention mechanisms. Detailed walkthrough of transformer architecture.',
                mainTopics: ['Transformers', 'Attention Mechanisms'],
                sentiment: 'positive',
                keyQuotes: ['Attention is all you need']
            }
        },
        {
            id: 'zRx7_dF0RHM',
            title: 'Machine Learning in Production - Best Practices',
            channel: 'AI Exchange',
            duration: '1h 15m',
            viewCount: 156789,
            uploadDate: '2024-02-01',
            thumbnail: 'https://img.youtube.com/vi/zRx7_dF0RHM/hqdefault.jpg',
            url: 'https://www.youtube.com/watch?v=zRx7_dF0RHM',
            sentiment: 'positive',
            topics: ['MLOps', 'Production ML'],
            transcript: 'Welcome to this session on ML in production. So many teams struggle with deploying models effectively.',
            analysis: {
                summary: 'Practical guide to MLOps covering deployment, monitoring, and scaling challenges for enterprise AI applications.',
                mainTopics: ['MLOps Pipelines', 'Model Monitoring'],
                sentiment: 'positive',
                keyQuotes: ['If your model is not in production, it is not creating value']
            }
        },
        {
            id: 'zaqhLlTuNgg',
            title: 'Natural Language Processing Advances 2024',
            channel: 'AI Exchange',
            duration: '1h 4m',
            viewCount: 198234,
            uploadDate: '2024-02-10',
            thumbnail: 'https://img.youtube.com/vi/zaqhLlTuNgg/hqdefault.jpg',
            url: 'https://www.youtube.com/watch?v=zaqhLlTuNgg',
            sentiment: 'positive',
            topics: ['NLP', 'Language Models'],
            transcript: 'Hello and welcome. NLP has seen incredible advances in the past few years.',
            analysis: {
                summary: 'State of the art in NLP with detailed walkthrough of transformer architectures and generation techniques.',
                mainTopics: ['Language Models', 'Fine-tuning'],
                sentiment: 'positive',
                keyQuotes: ['The pace of innovation in language models is truly incredible']
            }
        },
        {
            id: 'RRE8SfrreZw',
            title: 'Computer Vision for Real-World Applications',
            channel: 'AI Exchange',
            duration: '1h 10m',
            viewCount: 167890,
            uploadDate: '2024-02-20',
            thumbnail: 'https://img.youtube.com/vi/RRE8SfrreZw/hqdefault.jpg',
            url: 'https://www.youtube.com/watch?v=RRE8SfrreZw',
            sentiment: 'positive',
            topics: ['Computer Vision', 'Object Detection'],
            transcript: 'Today we are looking at computer vision applications. These technologies are rapidly changing how machines see the world.',
            analysis: {
                summary: 'Practical computer vision applications from object detection to segmentation with real-world examples.',
                mainTopics: ['Object Detection', 'Segmentation'],
                sentiment: 'positive',
                keyQuotes: ['Vision models are reaching human-level performance']
            }
        },
        {
            id: 'abc123def456',
            title: 'LLMs for Vision - Multimodal AI Revolution',
            channel: 'AI Exchange',
            duration: '1h 20m',
            viewCount: 98765,
            uploadDate: '2024-03-01',
            thumbnail: 'https://img.youtube.com/vi/abc123def456/hqdefault.jpg',
            url: 'https://www.youtube.com/watch?v=abc123def456',
            sentiment: 'positive',
            topics: ['Multimodal AI', 'Vision-Language Models'],
            transcript: 'The intersection of language and vision models is where the most exciting developments are happening.',
            analysis: {
                summary: 'Exploring multimodal AI systems that combine language and visual understanding.',
                mainTopics: ['CLIP', 'DALL-E'],
                sentiment: 'positive',
                keyQuotes: ['Multimodal models are closing the gap between human and machine perception']
            }
        },
        {
            id: 'xyz789ghi012',
            title: 'AI Ethics Panel - Navigating the Challenges',
            channel: 'AI Exchange',
            duration: '1h 30m',
            viewCount: 145678,
            uploadDate: '2024-03-10',
            thumbnail: 'https://img.youtube.com/vi/xyz789ghi012/hqdefault.jpg',
            url: 'https://www.youtube.com/watch?v=xyz789ghi012',
            sentiment: 'neutral',
            topics: ['AI Ethics', 'Bias', 'Regulation'],
            transcript: 'Today we address some of the most pressing ethical questions in AI development.',
            analysis: {
                summary: 'Ethical discussion on bias, fairness, and responsible AI development practices.',
                mainTopics: ['Algorithmic Bias', 'Fairness', 'Transparency'],
                sentiment: 'neutral',
                keyQuotes: ['Ethics cannot be an afterthought - it must be built into the design process']
            }
        },
        {
            id: 'mno345pqr678',
            title: 'Reinforcement Learning from Human Feedback',
            channel: 'AI Exchange',
            duration: '58m',
            viewCount: 76543,
            uploadDate: '2024-03-15',
            thumbnail: 'https://img.youtube.com/vi/mno345pqr678/hqdefault.jpg',
            url: 'https://www.youtube.com/watch?v=mno345pqr678',
            sentiment: 'positive',
            topics: ['Reinforcement Learning', 'Alignment'],
            transcript: 'RLHF has become a critical technique for aligning AI systems with human values.',
            analysis: {
                summary: 'Deep dive into Reinforcement Learning from Human Feedback and its applications.',
                mainTopics: ['RLHF', 'Reward Modeling'],
                sentiment: 'positive',
                keyQuotes: ['Human feedback provides crucial signal for aligning AI systems']
            }
        },
        {
            id: 'stu901vwx234',
            title: 'Edge AI - Running ML on Devices',
            channel: 'AI Exchange',
            duration: '45m',
            viewCount: 67890,
            uploadDate: '2024-03-20',
            thumbnail: 'https://img.youtube.com/vi/stu901vwx234/hqdefault.jpg',
            url: 'https://www.youtube.com/watch?v=stu901vwx234',
            sentiment: 'positive',
            topics: ['Edge AI', 'Mobile ML'],
            transcript: 'Bringing AI to the edge means processing data locally on devices.',
            analysis: {
                summary: 'Techniques for optimizing ML models to run efficiently on edge devices.',
                mainTopics: ['Model Quantization', 'Edge Deployment'],
                sentiment: 'positive',
                keyQuotes: ['Edge AI enables privacy-preserving applications with zero latency']
            }
        },
        {
            id: 'yza567bcd890',
            title: 'The Future of AGI - What Experts Predict',
            channel: 'AI Exchange',
            duration: '1h 40m',
            viewCount: 312345,
            uploadDate: '2024-03-25',
            thumbnail: 'https://img.youtube.com/vi/yza567bcd890/hqdefault.jpg',
            url: 'https://www.youtube.com/watch?v=yza567bcd890',
            sentiment: 'positive',
            topics: ['AGI', 'Superintelligence'],
            transcript: 'Where do we stand on the path to Artificial General Intelligence?',
            analysis: {
                summary: 'Expert predictions and timelines for AGI development based on current progress rates.',
                mainTopics: ['AGI Roadmap', 'Intelligence Scaling', 'Takeoff Scenarios'],
                sentiment: 'positive',
                keyQuotes: ['The pace of progress suggests AGI may arrive sooner than many expect']
            }
        },
        {
            id: 'efg123hij456',
            title: 'Computer Vision in Healthcare Applications',
            channel: 'AI Exchange',
            duration: '50m',
            viewCount: 89012,
            uploadDate: '2024-03-28',
            thumbnail: 'https://img.youtube.com/vi/efg123hij456/hqdefault.jpg',
            url: 'https://www.youtube.com/watch?v=efg123hij456',
            sentiment: 'positive',
            topics: ['Healthcare AI', 'Medical Imaging'],
            transcript: 'AI is transforming healthcare through advanced computer vision applications.',
            analysis: {
                summary: 'Medical imaging analysis using deep learning for disease detection and diagnosis.',
                mainTopics: ['Medical Imaging', 'Disease Detection', 'Healthcare AI'],
                sentiment: 'positive',
                keyQuotes: ['AI-assisted diagnosis is improving outcomes for patients worldwide']
            }
        },
        {
            id: 'klm789nop012',
            title: 'MLOps Best Practices for Startup Teams',
            channel: 'AI Exchange',
            duration: '48m',
            viewCount: 56789,
            uploadDate: '2024-03-30',
            thumbnail: 'https://img.youtube.com/vi/klm789nop012/hqdefault.jpg',
            url: 'https://www.youtube.com/watch?v=klm789nop012',
            sentiment: 'positive',
            topics: ['MLOps', 'Startup AI'],
            transcript: 'For startups, implementing MLOps can be challenging but essential.',
            analysis: {
                summary: 'Practical MLOps advice for resource-constrained startup teams.',
                mainTopics: ['Startup Tech Stack', 'MLOps MVP'],
                sentiment: 'positive',
                keyQuotes: ['Start with a simple MLOps pipeline - you can always expand later']
            }
        },
        {
            id: 'pqr345stu678',
            title: 'AI in Finance - Quantitative Strategies',
            channel: 'AI Exchange',
            duration: '55m',
            viewCount: 123456,
            uploadDate: '2024-04-01',
            thumbnail: 'https://img.youtube.com/vi/pqr345stu678/hqdefault.jpg',
            url: 'https://www.youtube.com/watch?v=pqr345stu678',
            sentiment: 'positive',
            topics: ['FinTech', 'Quantitative Finance', 'AI Trading'],
            transcript: 'Artificial intelligence is revolutionizing how financial markets operate.',
            analysis: {
                summary: 'Quantitative strategies powered by machine learning for trading and risk management.',
                mainTopics: ['Algorithmic Trading', 'Risk Management', 'FinTech'],
                sentiment: 'positive',
                keyQuotes: ['AI-driven trading systems are achieving consistent alpha generation']
            }
        },
        {
            id: 'vwx901yza234',
            title: 'Large Language Models Explained',
            channel: 'AI Exchange',
            duration: '1h 10m',
            viewCount: 289012,
            uploadDate: '2024-04-05',
            thumbnail: 'https://img.youtube.com/vi/vwx901yza234/hqdefault.jpg',
            url: 'https://www.youtube.com/watch?v=vwx901yza234',
            sentiment: 'positive',
            topics: ['LLM', 'NLP', 'Generative AI'],
            transcript: 'Understanding the architecture and capabilities of large language models.',
            analysis: {
                summary: 'Comprehensive guide to LLM architecture, training, and applications.',
                mainTopics: ['Transformer Architecture', 'Tokenization', 'Prompt Engineering'],
                sentiment: 'positive',
                keyQuotes: ['LLMs represent a paradigm shift in how we interact with technology']
            }
        },
        {
            id: 'bcd567efg890',
            title: 'AI Regulation and Policy - Global Perspectives',
            channel: 'AI Exchange',
            duration: '1h 25m',
            viewCount: 98765,
            uploadDate: '2024-04-10',
            thumbnail: 'https://img.youtube.com/vi/bcd567efg890/hqdefault.jpg',
            url: 'https://www.youtube.com/watch?v=bcd567efg890',
            sentiment: 'neutral',
            topics: ['Policy', 'Regulation', 'Global AI'],
            transcript: 'Governments worldwide are developing frameworks for AI governance.',
            analysis: {
                summary: 'Comparative analysis of AI regulation approaches across major economies.',
                mainTopics: ['EU AI Act', 'US Policy', 'China Regulations'],
                sentiment: 'neutral',
                keyQuotes: ['Global coordination on AI governance is essential for safe development']
            }
        },
        {
            id: 'hij123klm456',
            title: 'AI Research Highlights 2024',
            channel: 'AI Exchange',
            duration: '1h 35m',
            viewCount: 178901,
            uploadDate: '2024-04-15',
            thumbnail: 'https://img.youtube.com/vi/hij123klm456/hqdefault.jpg',
            url: 'https://www.youtube.com/watch?v=hij123klm456',
            sentiment: 'positive',
            topics: ['Research', 'AGI', ' cutting-edge AI'],
            transcript: 'A comprehensive review of the most significant AI research breakthroughs.',
            analysis: {
                summary: 'Summary of major AI research advances from top labs worldwide.',
                mainTopics: ['Model Scaling', 'Architecture Innovations', 'Benchmarking'],
                sentiment: 'positive',
                keyQuotes: ['2024 has been a landmark year for AI research advancement']
            }
        },
        {
            id: 'nop789qrs012',
            title: 'Building AI Products - Lessons Learned',
            channel: 'AI Exchange',
            duration: '1h 18m',
            viewCount: 134567,
            uploadDate: '2024-04-20',
            thumbnail: 'https://img.youtube.com/vi/nop789qrs012/hqdefault.jpg',
            url: 'https://www.youtube.com/watch?v=nop789qrs012',
            sentiment: 'positive',
            topics: ['AI Products', 'Product Management', 'Engineering'],
            transcript: 'Practical advice for building and shipping AI-powered products.',
            analysis: {
                summary: 'Lessons from shipping multiple AI products to market successfully.',
                mainTopics: ['MVP Development', 'User Feedback', 'Iterative Improvement'],
                sentiment: 'positive',
                keyQuotes: ['AI products need to solve real problems, not just showcase technology']
            }
        }
    ];

    // Speakers database
    DataStore.speakers = {
        'Dr. Sarah Chen': {
            id: 1,
            name: 'Dr. Sarah Chen',
            expertise: 'AI Safety, Ethics, Policy',
            bio: 'Leading AI safety researcher focused on alignment and long-term risks. Works at the intersection of computer science and philosophy.',
            totalAppearances: 12,
            avgSentiment: 92.0,
            influenceScore: 85.0
        },
        'Prof. Alex Rodriguez': {
            id: 2,
            name: 'Prof. Alex Rodriguez',
            expertise: 'Neural Networks, Deep Learning',
            bio: 'Professor at Stanford University specializing in deep learning and neural architectures. Author of "Deep Learning Fundamentals".',
            totalAppearances: 18,
            avgSentiment: 88.0,
            influenceScore: 92.0
        },
        'Maria Johnson': {
            id: 3,
            name: 'Maria Johnson',
            expertise: 'MLOps, Production ML',
            bio: 'CTO at DataScale.ai with expertise in deploying ML models at scale. Former lead engineer at major tech company.',
            totalAppearances: 9,
            avgSentiment: 94.0,
            influenceScore: 78.0
        },
        'Dr. James Liu': {
            id: 4,
            name: 'Dr. James Liu',
            expertise: 'Natural Language Processing, Language Models',
            bio: 'Research scientist at Hugging Face working on open-source language models and NLP tools.',
            totalAppearances: 15,
            avgSentiment: 90.0,
            influenceScore: 88.0
        },
        'Emily Williams': {
            id: 5,
            name: 'Emily Williams',
            expertise: 'Computer Vision, Robotics',
            bio: 'PhD from MIT and robotics entrepreneur focused on computer vision applications in autonomous systems.',
            totalAppearances: 7,
            avgSentiment: 86.0,
            influenceScore: 72.0
        },
        'Dr. Michael Thompson': {
            id: 6,
            name: 'Dr. Michael Thompson',
            expertise: 'Quantitative Finance, AI Trading',
            bio: 'Head of Research at AlgoTrade.ai. Expert in quantitative strategies and algorithmic trading systems.',
            totalAppearances: 2,
            avgSentiment: 91.0,
            influenceScore: 76.0
        },
        'Prof. Lisa Park': {
            id: 7,
            name: 'Prof. Lisa Park',
            expertise: 'AI Policy, Regulation',
            bio: 'Director of the Center for AI Governance. Advisor to government bodies on AI policy development.',
            totalAppearances: 3,
            avgSentiment: 89.0,
            influenceScore: 82.0
        },
        'Dr. Raj Patel': {
            id: 8,
            name: 'Dr. Raj Patel',
            expertise: 'Healthcare AI, Medical Imaging',
            bio: 'Radiologist and AI researcher pioneering medical imaging analysis with deep learning.',
            totalAppearances: 2,
            avgSentiment: 93.0,
            influenceScore: 74.0
        },
        'Alex Turner': {
            id: 9,
            name: 'Alex Turner',
            expertise: 'AI Product Management',
            bio: 'Product leader with extensive experience building and launching AI-powered products.',
            totalAppearances: 3,
            avgSentiment: 87.0,
            influenceScore: 68.0
        }
    };

    // Topics database with relationships
    DataStore.topics = {
        'AI Safety': {
            name: 'AI Safety',
            description: 'Research on aligning AI systems with human values and mitigating existential risks.',
            category: 'ethics',
            mentions: 45
        },
        'Neural Networks': {
            name: 'Neural Networks',
            description: 'Deep learning architectures, training strategies, and architectural innovations.',
            category: 'technology',
            mentions: 123
        },
        'MLOps': {
            name: 'MLOps',
            description: 'Machine learning operations, deployment pipelines, and production monitoring.',
            category: 'engineering',
            mentions: 34
        },
        'NLP': {
            name: 'Natural Language Processing',
            description: 'Natural language processing, language models, and text generation techniques.',
            category: 'technology',
            mentions: 56
        },
        'Computer Vision': {
            name: 'Computer Vision',
            description: 'Image analysis, object detection, and visual perception systems.',
            category: 'technology',
            mentions: 28
        },
        'Generative AI': {
            name: 'Generative AI',
            description: 'Large language models, diffusion models, and content generation techniques.',
            category: 'technology',
            mentions: 89
        },
        'AI Ethics': {
            name: 'AI Ethics',
            description: 'Bias mitigation, fairness, transparency, and responsible AI development.',
            category: 'ethics',
            mentions: 31
        },
        'Policy': {
            name: 'Policy',
            description: 'Government regulation, standards, and policy frameworks for AI.',
            category: 'policy',
            mentions: 19
        },
        'Multimodal AI': {
            name: 'Multimodal AI',
            description: 'Vision-language models like CLIP and DALL-E for cross-modal understanding.',
            category: 'technology',
            mentions: 15
        },
        'Reinforcement Learning': {
            name: 'Reinforcement Learning',
            description: 'RL algorithms, human feedback techniques, and alignment methods.',
            category: 'technology',
            mentions: 22
        },
        'AGI': {
            name: 'AGI',
            description: 'Artificial General Intelligence research and development timelines.',
            category: 'research',
            mentions: 18
        },
        'FinTech': {
            name: 'FinTech',
            description: 'AI applications in financial services and quantitative trading.',
            category: 'industry',
            mentions: 12
        },
        'Healthcare AI': {
            name: 'Healthcare AI',
            description: 'Medical imaging, diagnostics, and healthcare delivery optimization.',
            category: 'industry',
            mentions: 9
        }
    };
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const viewId = link.getAttribute('data-view');
            switchView(viewId);
        });
    });

    // Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase();
            filterVideos(query);
        });
    }

    // Topic filter
    const topicFilter = document.getElementById('topicFilter');
    if (topicFilter) {
        topicFilter.addEventListener('change', () => {
            const topic = topicFilter.value;
            if (topic) {
                filterByTopic(topic);
            } else {
                // Reset to all
                document.querySelectorAll('#videoGrid .video-card').forEach(card => card.style.display = 'block');
            }
        });
    }

    // Close modal
    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => closeModal());
    }

    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target.id === 'videoModal') {
            closeModal();
        }
    });
}

/**
 * Switch between views
 */
function switchView(viewId) {
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-link[data-view="${viewId}"]`);
    if (activeLink) activeLink.classList.add('active');

    // Show selected view, hide others
    Object.values(window.views).forEach(v => v.classList.remove('active'));
    if (window.views[viewId]) window.views[viewId].classList.add('active');

    // Render specific view content
    if (viewId === 'speakers') renderSpeakersGrid();
    else if (viewId === 'topics') renderTopicsGrid();
}

/**
 * Render dashboard with stats and charts
 */
function renderDashboard() {
    if (!document.getElementById('dashboard')) return;

    // Calculate statistics
    const totalVideos = DataStore.videos.length;
    const totalViews = DataStore.videos.reduce((sum, v) => sum + (v.viewCount || 0), 0);
    const avgSentiment = totalVideos > 0
        ? Math.round(DataStore.videos.reduce((sum, v) => sum + getSentimentScore(v.sentiment), 0) / totalVideos)
        : 89;

    // Update stats cards with animation
    animateStat('totalVideos', totalVideos.toLocaleString());
    animateStat('totalSpeakers', Object.keys(DataStore.speakers).length.toLocaleString());
    animateStat('totalViews', formatNumber(totalViews));
    animateStat('avgSentiment', `${avgSentiment}%`);

    // Render charts
    renderViewsChart();
    renderSentimentChart();

    // Render featured videos
    const sorted = [...DataStore.videos].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    renderFeaturedVideos(sorted.slice(0, 4));

    // Render knowledge graph
    renderKnowledgeGraph();

    console.log(`Dashboard rendered: ${totalVideos} videos analyzed`);
}

/**
 * Get numeric score for sentiment
 */
function getSentimentScore(sentiment) {
    if (sentiment === 'positive') return 90;
    if (sentiment === 'negative') return 30;
    return 65; // neutral
}

/**
 * Format large numbers
 */
function formatNumber(num) {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
}

/**
 * Animate stat value
 */
function animateStat(elementId, finalValue) {
    const el = document.getElementById(elementId);
    if (!el) return;

    let current = 0;
    const duration = 1500; // ms
    const start = performance.now();

    function update(time) {
        const elapsed = time - start;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out quart
        const ease = 1 - Math.pow(1 - progress, 4);
        current = Math.floor(progress * parseFloat(finalValue.replace(/,/g, '')));

        if (elementId === 'totalViews') {
            el.textContent = formatNumber(current);
        } else if (elementId === 'totalVideos') {
            el.textContent = current.toLocaleString();
        } else if (elementId === 'avgSentiment') {
            el.textContent = current + '%';
        } else {
            el.textContent = current.toLocaleString();
        }

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

/**
 * Render views chart
 */
function renderViewsChart() {
    const ctx = document.getElementById('viewsChart');
    if (!ctx) return;

    // Aggregate by month
    const monthlyViews = {};
    DataStore.videos.forEach(video => {
        if (video.uploadDate) {
            const month = video.uploadDate.slice(0, 7);
            monthlyViews[month] = (monthlyViews[month] || 0) + (video.viewCount || 0);
        }
    });

    const labels = Object.keys(monthlyViews).sort();
    const data = labels.map(m => monthlyViews[m]);

    // Destroy existing chart
    if (window.viewsChart) window.viewsChart.destroy();

    window.viewsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.map(l => l.replace('-', '/')),
            datasets: [{
                label: 'Total Views',
                data: data,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: '#374151' } },
                x: { grid: { display: false } }
            }
        }
    });
}

/**
 * Render sentiment chart
 */
function renderSentimentChart() {
    const ctx = document.getElementById('sentimentChart');
    if (!ctx) return;

    // Count sentiment categories
    const counts = { positive: 0, neutral: 0, negative: 0 };
    DataStore.videos.forEach(v => {
        const sentiment = v.sentiment || 'neutral';
        counts[sentiment]++;
    });

    if (window.sentimentChart) window.sentimentChart.destroy();

    window.sentimentChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Positive', 'Neutral', 'Negative'],
            datasets: [{
                data: [counts.positive, counts.neutral, counts.negative],
                backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                borderWidth: 2,
                borderColor: '#13161f'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

/**
 * Render featured videos on dashboard
 */
function renderFeaturedVideos(videos) {
    const container = document.getElementById('featuredVideos');
    if (!container || !videos.length) return;

    container.innerHTML = videos.map(video => createVideoCardHTML(video)).join('');
}

/**
 * Filter and render video grid
 */
function filterVideos(query) {
    const container = document.getElementById('videoGrid');
    if (!container) return;

    let displayVideos = DataStore.videos;

    // Apply search filter
    if (query) {
        displayVideos = displayVideos.filter(v =>
            v.title.toLowerCase().includes(query) ||
            v.channel?.toLowerCase().includes(query) ||
            (v.topics && v.topics.some(t => t.toLowerCase().includes(query)))
        );
    }

    // Apply topic filter
    const topicFilter = document.getElementById('topicFilter');
    if (topicFilter && topicFilter.value) {
        displayVideos = displayVideos.filter(v => v.topics?.includes(topicFilter.value));
    }

    container.innerHTML = displayVideos.map(video => createVideoCardHTML(video)).join('');
}

/**
 * Filter by specific topic
 */
function filterByTopic(topic) {
    const container = document.getElementById('videoGrid');
    if (!container) return;

    const displayVideos = DataStore.videos.filter(v => v.topics?.includes(topic));
    container.innerHTML = displayVideos.map(video => createVideoCardHTML(video)).join('');
}

/**
 * Create HTML for video card
 */
function createVideoCardHTML(video) {
    const topicsHtml = (video.topics || []).map(t =>
        `<span class="badge badge-topic"><i class="fas fa-tag"></i> ${t}</span>`
    ).join('');

    const sentimentClass = {
        'positive': 'badge-positive',
        'neutral': 'badge-neutral',
        'negative': 'badge-negative'
    }[video.sentiment] || 'badge-neutral';

    return `
        <div class="card video-card" data-id="${video.id}">
            <div class="video-thumbnail">
                <img src="${video.thumbnail || 'https://via.placeholder.com/400x220'}"
                     alt="${video.title}"
                     style="width: 100%; height: 220px; object-fit: cover;">
                <div class="video-play-btn" onclick="event.stopPropagation(); openVideoModal('${video.id}')">
                    <i class="fas fa-play"></i>
                </div>
            </div>
            <div class="video-content">
                <h3 class="video-title">${video.title}</h3>
                <div class="video-meta">
                    <span><i class="fas fa-eye"></i> ${formatNumber(video.viewCount || 0)} views</span>
                    <span><i class="fas fa-clock"></i> ${video.duration || '1h'}</span>
                </div>
                <div class="tags-cloud">
                    ${topicsHtml}
                    <span class="badge ${sentimentClass}"><i class="fas fa-heart"></i> ${video.sentiment || 'neutral'}</span>
                </div>
                <div class="video-actions">
                    <button class="action-btn" onclick="event.stopPropagation(); analyzeVideo('${video.id}', '${escapeQuotes(video.title)}')">
                        <i class="fas fa-brain"></i> Analyze
                    </button>
                    <a href="${video.url}" target="_blank" class="action-btn">
                        <i class="fab fa-youtube"></i> Watch
                    </a>
                </div>
            </div>
        </div>
    `;
}

/**
 * Analyze video with local LLM
 */
async function analyzeVideo(videoId, videoTitle) {
    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';

    try {
        // Try local LLM
        const response = await fetch(CONFIG.llmUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'qwen/qwen3-vl-8b',
                system_prompt: 'You are an expert video analyst. Provide structured analysis in JSON format.',
                input: `Analyze this YouTube video:\n\nTitle: ${videoTitle}\nID: ${videoId}\n\nProvide: summary, main topics, key quotes, sentiment analysis.`
            }),
            timeout: 30000
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Analysis complete:', data);
            btn.innerHTML = '<i class="fas fa-check"></i> Done';
        } else {
            // Fallback to local analysis
            const analysis = generateMockAnalysis(videoTitle);
            console.log('Using mock analysis:', analysis);
            btn.innerHTML = '<i class="fas fa-check"></i> Done';
        }
    } catch (e) {
        console.warn('LLM analysis failed, using mock:', e);
        btn.innerHTML = '<i class="fas fa-brain"></i> Analyze';
    }

    setTimeout(() => {
        btn.disabled = false;
        if (!btn.innerHTML.includes('Done')) {
            btn.innerHTML = '<i class="fas fa-brain"></i> Analyze';
        }
    }, 2000);
}

/**
 * Generate mock analysis when LLM is unavailable
 */
function generateMockAnalysis(title) {
    return {
        summary: `Comprehensive analysis covering key points and insights from "${title}".`,
        mainTopics: ['AI Trends', 'Technology'],
        keyQuotes: ['The most important takeaway is continuous learning.', 'Practical applications drive innovation.'],
        sentiment: 'positive',
        recommendations: ['Watch related videos for deeper understanding.', 'Try implementing the concepts discussed.']
    };
}

/**
 * Open video modal
 */
function openVideoModal(videoId) {
    const video = DataStore.videos.find(v => v.id === videoId);
    if (!video) return;

    const modal = document.getElementById('videoModal');
    const titleEl = document.getElementById('modalTitle');
    const playerContainer = document.getElementById('modalPlayerContainer');
    const bodyEl = document.getElementById('modalBody');

    const videoCode = extractYouTubeVideoID(video.url);

    titleEl.textContent = video.title;
    playerContainer.innerHTML = `
        <iframe
            src="https://www.youtube.com/embed/${videoCode}?autoplay=1"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
        ></iframe>
    `;

    bodyEl.innerHTML = `
        <div style="margin-bottom: 20px;">
            <strong>Channel:</strong> ${video.channel}
            <br>
            <strong>Date:</strong> ${video.uploadDate || 'Unknown'}
            <br>
            <strong>Duration:</strong> ${video.duration || 'Unknown'}
            <br>
            <strong>Views:</strong> ${formatNumber(video.viewCount || 0)}
        </div>

        <h3 style="color: var(--text-primary); margin-bottom: 12px;">Summary</h3>
        <p>${video.analysis?.summary || 'No detailed summary available.'}</p>

        ${video.topics ? `
            <h3 style="color: var(--text-primary); margin-bottom: 12px; margin-top: 24px;">Topics</h3>
            <div class="tags-cloud">
                ${video.topics.map(t => `<span class="badge badge-topic">${t}</span>`).join('')}
            </div>
        ` : ''}

        ${video.analysis?.keyQuotes ? `
            <h3 style="color: var(--text-primary); margin-bottom: 12px; margin-top: 24px;">Key Quotes</h3>
            <div style="background: var(--bg-hover); padding: 16px; border-radius: 10px;">
                ${video.analysis.keyQuotes.map(q => `<p style="margin-bottom: 8px;">"${q}"</p>`).join('')}
            </div>
        ` : ''}

        <div style="margin-top: 24px;">
            <a href="${video.url}" target="_blank" class="btn" style="width: 100%;">
                <i class="fab fa-youtube"></i> Watch on YouTube
            </a>
        </div>
    `;

    modal.style.display = 'block';
}

/**
 * Close video modal
 */
function closeModal() {
    document.getElementById('videoModal').style.display = 'none';
}

/**
 * Extract YouTube video ID from URL
 */
function extractYouTubeVideoID(url) {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/);
    return match ? match[1] : '';
}

/**
 * Escape quotes for JavaScript strings
 */
function escapeQuotes(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

/**
 * Render speakers grid
 */
function renderSpeakersGrid() {
    const container = document.getElementById('speakerGrid');
    if (!container) return;

    container.innerHTML = Object.values(DataStore.speakers).map(speaker => `
        <div class="card speaker-card">
            <div class="speaker-avatar"><i class="fas fa-user"></i></div>
            <h3 class="speaker-name">${speaker.name}</h3>
            <p class="speaker-expertise"><i class="fas fa-user-md"></i> ${speaker.expertise}</p>
            <p>${speaker.bio}</p>
            <div class="speaker-stats">
                <div class="stat-item">
                    <span class="stat-item-value">${speaker.totalAppearances}</span>
                    <div class="stat-item-label">Videos</div>
                </div>
                <div class="stat-item">
                    <span class="stat-item-value" style="color: var(--accent-success)">${Math.round(speaker.avgSentiment)}%</span>
                    <div class="stat-item-label">Avg Sentiment</div>
                </div>
                <div class="stat-item">
                    <span class="stat-item-value">${Math.round(speaker.influenceScore)}</span>
                    <div class="stat-item-label">Influence</div>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Render topics grid
 */
function renderTopicsGrid() {
    const container = document.getElementById('topicGrid');
    if (!container) return;

    const sortedTopics = Object.values(DataStore.topics).sort((a, b) => b.mentions - a.mentions);

    container.innerHTML = sortedTopics.map(topic => `
        <div class="card topic-card">
            <div class="topic-icon"><i class="fas fa-tag"></i></div>
            <h3 class="topic-title">${topic.name}</h3>
            <p class="topic-description">${topic.description}</p>
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color);">
                <span class="badge badge-neutral"><i class="fas fa-book-open"></i> ${topic.mentions} mentions</span>
            </div>
        </div>
    `).join('');
}

/**
 * Render knowledge graph
 */
function renderKnowledgeGraph() {
    const container = document.getElementById('featuredVideos');
    if (!container) return;

    // Add knowledge graph section
    const graphHtml = `
        <div style="margin: 40px 0; padding: 24px; background: var(--bg-card); border-radius: 20px;">
            <h3 style="text-align: center; margin-bottom: 24px;">Knowledge Graph</h3>
            <p style="text-align: center; color: var(--text-secondary); margin-bottom: 24px;">Related topics and content connections</p>
            <div class="tags-cloud" style="justify-content: center;">
                <span class="badge badge-topic">AI Safety</span>
                <span style="margin: 0 15px; color: var(--text-secondary);"><i class="fas fa-arrow-right"></i></span>
                <span class="badge badge-topic">Ethics</span>
                <br><br><br>
                <span class="badge badge-topic">Neural Networks</span>
                <span style="margin: 0 15px; color: var(--text-secondary);"><i class="fas fa-arrow-right"></i></span>
                <span class="badge badge-topic">Deep Learning</span>
                <br><br><br>
                <span class="badge badge-topic">MLOps</span>
                <span style="margin: 0 15px; color: var(--text-secondary);"><i class="fas fa-arrow-right"></i></span>
                <span class="badge badge-topic">Production AI</span>
                <br><br><br>
                <span class="badge badge-topic">NLP</span>
                <span style="margin: 0 15px; color: var(--text-secondary);"><i class="fas fa-arrow-right"></i></span>
                <span class="badge badge-topic">Generative AI</span>
                <br><br><br>
                <span class="badge badge-topic">Computer Vision</span>
                <span style="margin: 0 15px; color: var(--text-secondary);"><i class="fas fa-arrow-right"></i></span>
                <span class="badge badge-topic">Multimodal AI</span>
            </div>
        </div>
    `;

    // Insert after featured videos
    const insertPos = container.querySelector('.video-grid') ? container.querySelector('.video-grid').nextElementSibling : null;
    const div = document.createElement('div');
    div.innerHTML = graphHtml;
    if (insertPos) {
        container.insertBefore(div, insertPos);
    } else {
        container.appendChild(div);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
