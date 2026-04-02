// AI Exchange Web App
// Comprehensive analytics application

class AIExchangeApp {
    constructor() {
        this.data = {
            videos: [],
            topics: {},
            quotes: [],
            speakers: [],
            insights: {},
            timeline: [],
            themeNetwork: { nodes: [], links: [] },
            transcriptsIndex: []
        };
        
        this.currentView = 'dashboard';
        this.chartInstances = {};
        this.networkGraph = null;
        
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.renderView('dashboard');
    }

    async loadData() {
        try {
            const [
                videos, topics, quotes, speakers, insights, timeline, themeNetwork, transcriptsIndex
            ] = await Promise.all([
                fetch('data/videos.json').then(r => r.json()).catch(() => []),
                fetch('data/topics.json').then(r => r.json()).catch(() => {}),
                fetch('data/quotes.json').then(r => r.json()).catch(() => []),
                fetch('data/speakers.json').then(r => r.json()).catch(() => []),
                fetch('data/insights.json').then(r => r.json()).catch(() => {}),
                fetch('data/timeline.json').then(r => r.json()).catch(() => []),
                fetch('data/theme_network.json').then(r => r.json()).catch(() => ({ nodes: [], links: [] })),
                fetch('data/transcripts_index.json').then(r => r.json()).catch(() => [])
            ]);

            this.data.videos = videos;
            this.data.topics = topics;
            this.data.quotes = quotes;
            this.data.speakers = speakers;
            this.data.insights = insights;
            this.data.timeline = timeline;
            this.data.themeNetwork = themeNetwork;
            this.data.transcriptsIndex = transcriptsIndex;

            this.updateStats();
            this.initCharts();
            
            // Initialize theme explorer network
            if (themeNetwork.nodes.length > 0) {
                this.initThemeExplorer();
            }
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Failed to load data. Please ensure the build script has been run.');
        }
    }

    updateStats() {
        document.getElementById('totalVideos').textContent = this.data.videos.length;
        document.getElementById('totalQuotes').textContent = this.data.quotes.length || 0;
        
        const topicCount = Object.keys(this.data.topics?.topic_counts || {}).length;
        document.getElementById('totalTopics').textContent = topicCount;
        
        document.getElementById('totalSpeakers').textContent = this.data.speakers.length || 0;
        
        // Find longest video
        if (this.data.videos.length > 0) {
            const sorted = [...this.data.videos].sort((a, b) => b.duration - a.duration);
            if (sorted.length > 0) {
                document.getElementById('mostViewedVideo').textContent = sorted[0].title;
            }
        }

        // Find most quoted video
        if (this.data.videos.length > 0) {
            const byQuotes = [...this.data.videos].sort((a, b) => (b.quotes?.length || 0) - (a.quotes?.length || 0));
            if (byQuotes.length > 0 && byQuotes[0].quotes?.length > 0) {
                document.getElementById('highestRatedVideo').textContent = `${byQuotes[0].title} (${byQuotes[0].quotes.length} quotes)`;
            }
        }

        // Find most discussed topic
        const topicCounts = this.data.topics?.topic_counts || {};
        const mostDiscussed = Object.entries(topicCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
        
        if (mostDiscussed.length > 0) {
            document.getElementById('mostDiscussedTopic').textContent = 
                mostDiscussed.map(t => t[0]).join(', ');
        }
    }

    initCharts() {
        // Topics Distribution Chart
        const topicCounts = this.data.topics?.topic_counts || {};
        const topTopics = Object.entries(topicCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        if (topTopics.length > 0) {
            const ctx = document.getElementById('topicsChart');
            if (ctx) {
                this.chartInstances.topics = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: topTopics.map(t => t[0]),
                        datasets: [{
                            label: 'Video Count',
                            data: topTopics.map(t => t[1]),
                            backgroundColor: [
                                '#7c3aed', '#ec4899', '#10b981', '#f59e0b', 
                                '#3b82f6', '#8b5cf6', '#06b6d4', '#d946ef'
                            ],
                            borderRadius: 8
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { display: false },
                            title: { display: false }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: { color: '#2a2a3a' },
                                ticks: { color: '#a0a0b0' }
                            },
                            x: {
                                grid: { display: false },
                                ticks: { color: '#a0a0b0' }
                            }
                        }
                    }
                });
            }
        }

        // Dashboard Topic Network
        this.initDashboardNetwork();

        // Featured Analyses
        this.renderFeaturedAnalyses();
    }

    renderFeaturedAnalyses() {
        const container = document.getElementById('featuredAnalyses');
        if (container) {
            const topVideos = [...this.data.videos].slice(0, 3);
            
            container.innerHTML = topVideos.map(video => `
                <div class="card">
                    <h3>${video.title}</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 15px;">${video.channel}</p>
                    ${video.summary ? `
                        <div class="card-body">
                            <p>${video.summary}</p>
                        </div>
                    ` : ''}
                    ${video.topics?.length > 0 ? `
                        <div style="margin-top: 15px;">
                            ${video.topics.slice(0, 3).map(t => 
                                `<span class="badge badge-topic">${t}</span>`
                            ).join('')}
                        </div>
                    ` : ''}
                </div>
            `).join('');
        }
    }

    renderView(viewName) {
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.view === viewName);
        });

        // Update views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        this.currentView = viewName;
        
        const viewElement = document.getElementById(`${viewName}View`);
        if (viewElement) {
            viewElement.classList.add('active');
            
            // Specific view rendering
            switch(viewName) {
                case 'dashboard':
                    if (this.chartInstances.topics) this.chartInstances.topics.destroy();
                    if (this.chartInstances.sentiment) this.chartInstances.sentiment.destroy();
                    this.initCharts();
                    break;
                case 'videos':
                    this.renderVideos();
                    break;
                case 'themes':
                    if (this.data.themeNetwork.nodes.length > 0) {
                        this.initThemeExplorer();
                        this.renderThemeThemes();
                    }
                    break;
                case 'speakers':
                    this.renderSpeakers();
                    break;
                case 'quotes':
                    this.renderQuotes();
                    break;
                case 'insights':
                    this.renderInsights();
                    break;
                case 'timeline':
                    this.renderTimeline();
                    break;
            }
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = e.target.dataset.view;
                this.switchView(view);
            });
        });

        // Search
        document.getElementById('searchBtn').addEventListener('click', () => this.performSearch());
        
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });

        // Filter dropdowns
        const topicSelect = document.getElementById('topicFilter');
        if (topicSelect) {
            this.populateTopicFilters();
            topicSelect.addEventListener('change', () => this.renderVideos());
        }

    }

    populateTopicFilters() {
        const topicSelect = document.getElementById('topicFilter');
        if (!topicSelect) return;

        const topicCounts = this.data.topics?.topic_counts || {};
        const sortedTopics = Object.entries(topicCounts)
            .sort((a, b) => b[1] - a[1]);

        sortedTopics.forEach(([topic]) => {
            const option = document.createElement('option');
            option.value = topic;
            option.textContent = topic.charAt(0).toUpperCase() + topic.slice(1);
            topicSelect.appendChild(option);
        });
    }

    switchView(viewName) {
        window.location.hash = viewName;
        this.renderView(viewName);
    }

    renderVideos() {
        const container = document.getElementById('videosList');
        if (!container) return;

        const topicFilter = document.getElementById('topicFilter')?.value || '';

        let filteredVideos = this.data.videos;

        if (topicFilter) {
            filteredVideos = filteredVideos.filter(v =>
                v.topics?.some(t => t.toLowerCase() === topicFilter.toLowerCase())
            );
        }

        if (filteredVideos.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No videos found matching your filters</p></div>';
            return;
        }

        container.innerHTML = filteredVideos.map(video => `
            <div class="card" onclick="app.openVideoModal('${video.id}')">
                ${video.thumbnail_url ? `
                    <img src="${video.thumbnail_url}" alt="${this.truncate(video.title, 40)}"
                         style="width:100%; border-radius:8px 8px 0 0; aspect-ratio:16/9; object-fit:cover;"
                         onerror="this.parentElement.removeChild(this)"
                         onload="if(this.naturalWidth<=120)this.parentElement.removeChild(this)">
                ` : ''}
                <div class="card-header">
                    <h3>${this.truncate(video.title, 60)}</h3>
                    ${video.duration ? `
                        <span class="badge">${this.formatDuration(video.duration)}</span>
                    ` : ''}
                    ${video.speaker && video.speaker !== 'Unknown' ? `
                        <span class="badge badge-topic">${video.speaker}</span>
                    ` : ''}
                </div>
                
                ${video.summary ? `
                    <div class="card-body">
                        <p>${this.truncate(video.summary, 150)}</p>
                    </div>
                ` : ''}
                
                ${video.topics?.length > 0 ? `
                    <div style="margin-top: 15px;">
                        ${video.topics.slice(0, 4).map(t => 
                            `<span class="badge badge-topic">${t}</span>`
                        ).join('')}
                    </div>
                ` : ''}
                
            </div>
        `).join('');
    }

    renderSpeakers() {
        const container = document.getElementById('speakersList');
        if (!container) return;

        if (this.data.speakers.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No speakers found</p></div>';
            return;
        }

        container.innerHTML = this.data.speakers.filter(s => s.name !== 'Unknown').map(speaker => {
            const linkedinUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(speaker.name)}`;
            return `
            <div class="card">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                    <h3>${speaker.name}</h3>
                    <a href="${linkedinUrl}" target="_blank" title="Search on LinkedIn"
                       style="color:var(--text-secondary);text-decoration:none;font-size:1.2rem;padding:2px 6px;border-radius:4px;background:var(--bg-hover);"
                       onclick="event.stopPropagation()">in</a>
                </div>

                <div style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;">
                    <span class="badge">${speaker.video_count} video${speaker.video_count !== 1 ? 's' : ''}</span>
                    ${speaker.topics?.slice(0, 3).map(topic => {
                        const [topicName] = Object.entries(topic)[0];
                        return `<span class="badge badge-topic">${topicName}</span>`;
                    }).join('') || ''}
                </div>

                ${speaker.videos?.length > 0 ? `
                    <div style="margin-top: 15px;">
                        ${speaker.videos.slice(0, 5).map(v => `
                            <div style="padding:10px;background:var(--bg-hover);border-radius:8px;margin-bottom:5px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;"
                                 onclick="app.openVideoModal('${v.id}')">
                                <span style="color:var(--text-primary);">${v.title}</span>
                                ${v.youtube_url ? `<a href="${v.youtube_url}" target="_blank" style="color:var(--accent-primary);font-size:0.85rem;white-space:nowrap;" onclick="event.stopPropagation()">Watch →</a>` : ''}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>`;
        }).join('');
    }

    renderQuotes() {
        const container = document.getElementById('quotesList');
        if (!container) return;

        const quoteTopicFilter = document.getElementById('quoteTopicFilter')?.value || '';

        let filteredQuotes = this.data.quotes;

        if (quoteTopicFilter) {
            filteredQuotes = filteredQuotes.filter(q => 
                q.topics?.some(t => t.toLowerCase() === quoteTopicFilter.toLowerCase())
            );
        }

        if (filteredQuotes.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No quotes found matching your filters</p></div>';
            return;
        }

        // Populate quote topic filter
        this.populateQuoteTopicFilters();

        container.innerHTML = filteredQuotes.map(quote => `
            <div class="card" style="border-left: 4px solid var(--accent-primary);">
                <div class="card-body">
                    <p style="font-size: 1.1rem; font-style: italic;">"${quote.quote}"</p>
                    
                    <div style="margin-top: 15px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>${this.truncate(quote.title, 40)}</strong>
                        </div>
                        
                        ${quote.topics?.length > 0 ? `
                            <div style="text-align: right;">
                                ${quote.topics.slice(0, 3).map(t => 
                                    `<span class="badge badge-topic">${t}</span>`
                                ).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    populateQuoteTopicFilters() {
        const quoteTopicSelect = document.getElementById('quoteTopicFilter');
        if (!quoteTopicSelect) return;

        // Get unique topics from quotes
        const quoteTopics = [...new Set(
            this.data.quotes.flatMap(q => q.topics || [])
        )].sort();

        quoteTopicSelect.innerHTML = '<option value="">All Topics</option>';

        quoteTopics.forEach(topic => {
            const option = document.createElement('option');
            option.value = topic;
            option.textContent = topic.charAt(0).toUpperCase() + topic.slice(1);
            quoteTopicSelect.appendChild(option);
        });
    }

    shuffleQuotes() {
        const container = document.getElementById('quotesList');
        if (container) {
            // Re-render with new order
            const quotes = [...this.data.quotes];
            for (let i = quotes.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [quotes[i], quotes[j]] = [quotes[j], quotes[i]];
            }
            
            container.innerHTML = quotes.slice(0, 12).map(q => `
                <div class="card" style="border-left: 4px solid var(--accent-primary);">
                    <div class="card-body">
                        <p style="font-size: 1.1rem; font-style: italic;">"${q.quote}"</p>
                        <div style="margin-top: 15px;">
                            <strong>${this.truncate(q.title, 40)}</strong>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    renderInsights() {
        const container = document.getElementById('insightsList');
        if (!container) return;

        // Top topics
        const topicCounts = this.data.topics?.topic_counts || {};
        const topTopics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

        // Most quoted videos
        const mostQuoted = [...this.data.videos].filter(v => v.quotes?.length > 0)
            .sort((a, b) => (b.quotes?.length || 0) - (a.quotes?.length || 0)).slice(0, 6);

        // Top speakers by video count
        const topSpeakers = this.data.speakers.filter(s => s.name !== 'Unknown').slice(0, 6);

        container.innerHTML = `
            <div class="stats-grid stats-secondary">
                <div class="stat-card">
                    <h4>Videos Analyzed</h4>
                    <p>${this.data.videos.length}</p>
                </div>
                <div class="stat-card">
                    <h4>Quotes Extracted</h4>
                    <p>${this.data.quotes.length}</p>
                </div>
                <div class="stat-card">
                    <h4>Unique Topics</h4>
                    <p>${Object.keys(topicCounts).length}</p>
                </div>
            </div>

            <h3 style="margin-top: 40px;">Top Topics</h3>
            <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:30px;">
                ${topTopics.map(([topic, count]) => `
                    <span class="badge badge-topic" style="cursor:pointer;padding:8px 16px;font-size:1rem;"
                          onclick="app._showTopicVideos('${topic.charAt(0).toUpperCase() + topic.slice(1)}')">
                        ${topic.charAt(0).toUpperCase() + topic.slice(1)} (${count})
                    </span>
                `).join('')}
            </div>

            <h3>Most Quoted Videos</h3>
            <div class="cards-grid">
                ${mostQuoted.map(v => `
                    <div class="card" style="cursor:pointer;" onclick="app.openVideoModal('${v.id}')">
                        <h3>${this.truncate(v.title, 50)}</h3>
                        <span class="badge">${v.quotes.length} quotes</span>
                        ${v.speaker && v.speaker !== 'Unknown' ? `<span class="badge badge-topic">${v.speaker}</span>` : ''}
                        ${v.quotes[0] ? `<p style="font-style:italic;color:var(--text-secondary);margin-top:10px;">"${this.truncate(v.quotes[0], 120)}"</p>` : ''}
                    </div>
                `).join('')}
            </div>

            <h3 style="margin-top: 40px;">Top Speakers</h3>
            <div class="cards-grid">
                ${topSpeakers.map(s => {
                    const linkedinUrl = 'https://www.linkedin.com/search/results/people/?keywords=' + encodeURIComponent(s.name);
                    return `
                    <div class="card">
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                            <h3>${s.name}</h3>
                            <a href="${linkedinUrl}" target="_blank" style="color:var(--text-secondary);text-decoration:none;padding:2px 6px;border-radius:4px;background:var(--bg-hover);">in</a>
                        </div>
                        <span class="badge">${s.video_count} video${s.video_count !== 1 ? 's' : ''}</span>
                        ${s.videos?.[0] ? `
                            <div style="margin-top:10px;padding:8px;background:var(--bg-hover);border-radius:6px;cursor:pointer;" onclick="app.openVideoModal('${s.videos[0].id}')">
                                <span style="color:var(--text-secondary);font-size:0.85rem;">${s.videos[0].title}</span>
                            </div>
                        ` : ''}
                    </div>`;
                }).join('')}
            </div>
        `;
    }

    renderTimeline() {
        const container = document.getElementById('timelineList');
        if (!container) return;

        if (this.data.timeline.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No timeline data available</p></div>';
            return;
        }

        container.innerHTML = this.data.timeline.map(event => `
            <div class="timeline-item">
                <div class="timeline-date">
                    ${event.upload_date ? this.formatDate(event.upload_date) : 'N/A'}
                </div>
                
                <div class="timeline-content">
                    <a href="#" class="timeline-title" onclick="event.preventDefault(); app.openVideoModal('${event.id}')">
                        ${this.truncate(event.title, 100)}
                    </a>
                    
                    <div class="timeline-meta">
                        ${event.channel ? `
                            <span class="timeline-channel">${event.channel}</span>
                        ` : ''}
                        
                        ${event.duration ? `
                            • ${this.formatDuration(event.duration)}
                        ` : ''}
                    </div>

                    <p style="color: var(--text-secondary); margin-top: 10px;">
                        ${event.summary}
                    </p>

                    ${event.topics?.length > 0 ? `
                        <div style="margin-top: 15px;">
                            ${event.topics.slice(0, 3).map(t => 
                                `<span class="badge badge-topic">${t}</span>`
                            ).join('')}
                        </div>
                    ` : ''}
                </div>

                <div class="timeline-video">
                    ${event.youtube_url ? `
                        <a href="${event.youtube_url}" target="_blank" 
                           style="color: var(--accent-primary); font-weight: 600;">
                            Watch →
                        </a>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    _createNetwork(container, tooltipEl, opts = {}) {
        const { nodes, links } = this.data.themeNetwork;
        if (nodes.length === 0) return null;

        const colors = ['#7c3aed','#ec4899','#3b82f6','#10b981','#f59e0b','#06b6d4','#d946ef','#8b5cf6'];
        const coloredNodes = nodes.map((n, i) => ({
            ...n,
            color: { background: colors[i % colors.length], border: colors[i % colors.length], highlight: { background: '#fff', border: colors[i % colors.length] } },
            font: { color: '#ffffff', face: 'Inter', size: opts.fontSize || 12 },
            size: Math.max(8, (n.value || 1) * (opts.sizeMultiplier || 3)),
        }));

        const datasetNodes = new vis.DataSet(coloredNodes);
        const datasetEdges = new vis.DataSet(links.map(link => ({
            from: link.source, to: link.target, value: link.value
        })));

        const network = new vis.Network(container, { nodes: datasetNodes, edges: datasetEdges }, {
            nodes: { shape: 'dot', borderWidth: 2, shadow: true },
            edges: { width: 1.5, color: { inherit: 'from', opacity: 0.4 }, smooth: { type: 'continuous' } },
            physics: {
                forceAtlas2Based: { gravitationalConstant: opts.gravity || -50, springLength: opts.springLen || 200, springConstant: 0.15 },
                maxVelocity: 100, minVelocity: 1, solver: 'forceAtlas2Based'
            },
            interaction: { hover: true, tooltipDelay: 50, zoomView: true, dragView: true }
        });

        // Hover: show tooltip
        network.on('hoverNode', (params) => {
            const node = nodes.find(n => n.id === params.node);
            if (node && tooltipEl) {
                const videos = this._getVideosForTopic(node.label);
                tooltipEl.innerHTML = `<strong>${node.label}</strong> — ${node.value} videos. Click to explore.`;
            }
            container.style.cursor = 'pointer';
        });
        network.on('blurNode', () => {
            if (tooltipEl) tooltipEl.innerHTML = 'Click a topic to explore related videos';
            container.style.cursor = 'default';
        });

        // Click: show videos for that topic
        network.on('click', (params) => {
            if (params.nodes.length > 0) {
                const node = nodes.find(n => n.id === params.nodes[0]);
                if (node) this._showTopicVideos(node.label);
            }
        });

        return network;
    }

    _getVideosForTopic(topicLabel) {
        const topic = topicLabel.toLowerCase();
        return this.data.videos.filter(v =>
            v.topics?.some(t => t.toLowerCase() === topic)
        );
    }

    _showTopicVideos(topicLabel) {
        const videos = this._getVideosForTopic(topicLabel);
        const modal = document.getElementById('videoModal');
        const body = document.getElementById('modalBody');

        body.innerHTML = `
            <button class="close-modal" onclick="app.closeModal()">&times;</button>
            <div style="padding: 30px;">
                <h2 class="modal-title">${topicLabel}</h2>
                <p style="color: var(--text-secondary); margin-bottom: 20px;">${videos.length} video${videos.length !== 1 ? 's' : ''} on this topic</p>
                <div class="cards-grid" style="grid-template-columns: 1fr;">
                    ${videos.map(v => {
                        const ytId = v.youtube_url?.split('v=')[1]?.split('&')[0] || v.id;
                        return `
                        <div class="card" style="display:flex; gap:15px; align-items:flex-start; cursor:pointer;" onclick="app.closeModal(); app.openVideoModal('${v.id}')">
                            <img src="https://img.youtube.com/vi/${ytId}/mqdefault.jpg" style="width:160px;border-radius:6px;flex-shrink:0;"
                                 onerror="this.style.display='none'" onload="if(this.naturalWidth<=120)this.style.display='none'">
                            <div>
                                <h3 style="margin-bottom:6px;">${v.title}</h3>
                                ${v.speaker && v.speaker !== 'Unknown' ? `<span class="badge badge-topic">${v.speaker}</span>` : ''}
                                ${v.summary ? `<p style="margin-top:8px;color:var(--text-secondary);">${this.truncate(v.summary, 150)}</p>` : ''}
                                ${v.youtube_url ? `<a href="${v.youtube_url}" target="_blank" style="color:var(--accent-primary);margin-top:8px;display:inline-block;" onclick="event.stopPropagation()">Watch on YouTube →</a>` : ''}
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>
        `;
        modal.style.display = 'block';
    }

    initDashboardNetwork() {
        const container = document.getElementById('dashboardNetwork');
        const tooltip = document.getElementById('networkTooltip');
        if (!container) return;
        if (this.dashboardGraph) this.dashboardGraph.destroy();
        this.dashboardGraph = this._createNetwork(container, tooltip, { gravity: -30, springLen: 150, fontSize: 11, sizeMultiplier: 2.5 });
    }

    initThemeExplorer() {
        const container = document.getElementById('networkGraph');
        const tooltip = document.getElementById('themeTooltip');
        if (!container) return;
        if (this.networkGraph) this.networkGraph.destroy();
        this.networkGraph = this._createNetwork(container, tooltip, { gravity: -60, springLen: 220, fontSize: 13, sizeMultiplier: 3.5 });
    }

    renderThemeThemes() {
        const container = document.getElementById('topThemes');
        if (!container) return;

        const topicCounts = this.data.topics?.topic_counts || {};
        const sortedTopics = Object.entries(topicCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8);

        if (sortedTopics.length > 0) {
            container.innerHTML = sortedTopics.map(([topic, count]) => `
                <div class="card">
                    <h3 style="color: var(--accent-primary);">${topic.charAt(0).toUpperCase() + topic.slice(1)}</h3>
                    <p>${count} videos</p>
                    
                    ${this.data.topics?.topic_videos?.[topic]?.length > 0 ? `
                        <details style="margin-top: 15px; color: var(--text-secondary);">
                            <summary>Top Videos</summary>
                            <div style="margin-top: 10px;">
                                ${this.data.topics.topic_videos[topic].slice(0, 3).map(v => `
                                    <div style="padding: 8px; background: var(--bg-hover); 
                                             border-radius: 8px; margin-bottom: 5px;">
                                        ${v.title}
                                    </div>
                                `).join('')}
                            </div>
                        </details>
                    ` : ''}
                </div>
            `).join('');
        }
    }

    openVideoModal(videoId) {
        const modal = document.getElementById('videoModal');
        const body = document.getElementById('modalBody');
        if (!modal || !body) return;

        const video = this.data.videos.find(v => v.id === videoId);
        
        if (video) {
            const timestamp = this.formatDate(video.upload_date);

            let framesHtml = '';
            if (video.frame_count && video.frame_count > 0) {
                // In a real app, these would be actual frame images
                framesHtml = `
                    <div style="margin: 30px 0;">
                        <h4>Presentation Frames</h4>
                        <p style="color: var(--text-secondary);">${video.frame_count} frames extracted from video</p>
                    </div>
                `;
            }

            let transcriptHtml = '';
            if (video.transcript_available) {
                transcriptHtml = `
                    <div style="margin: 30px 0;">
                        <h4>Full Transcript</h4>
                        <p style="color: var(--text-secondary);">Transcript available for this video</p>
                    </div>
                `;
            }

            body.innerHTML = `
                <button class="close-modal" onclick="app.closeModal()">&times;</button>
                
                <div style="padding: 30px;">
                    ${video.youtube_url ? `
                        <iframe width="100%" height="500"
                                src="https://www.youtube.com/embed/${video.youtube_url.split('v=')[1]?.split('&')[0] || video.id}"
                                frameborder="0" allow="autoplay; encrypted-media" allowfullscreen
                                style="border-radius: 8px;">
                        </iframe>
                    ` : `
                        <div style="padding: 50px; text-align: center;">
                            <h3>Video not available</h3>
                        </div>
                    `}

                    <h2 class="modal-title">${video.title}</h2>
                    <div class="modal-meta">
                        ${video.channel ? `<strong>${video.channel}</strong> • ` : ''}
                        ${timestamp}
                    </div>

                    ${video.summary ? `
                        <div class="modal-body">
                            <h3>Summary</h3>
                            <p>${video.summary}</p>
                        </div>
                    ` : ''}

                    ${video.sentiment ? `
                        <h3>Sentiment Analysis</h3>
                        <div style="margin: 15px 0;">
                            <span class="badge badge-sentiment ${video.sentiment.toLowerCase()}">
                                ${video.sentiment}
                            </span>
                        </div>
                    ` : ''}

                    ${video.quotes?.length > 0 ? `
                        <div class="modal-quotes">
                            <h3>Key Quotes</h3>
                            ${video.quotes.slice(0, 3).map((q, i) => `
                                <div class="quote-item">
                                    \"${q}\"
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}

                    ${video.topics?.length > 0 ? `
                        <div class="modal-topics">
                            <h3>Topics</h3>
                            ${video.topics.map(t => 
                                `<span class="badge badge-topic">${t}</span>`
                            ).join('')}
                        </div>
                    ` : ''}

                    ${framesHtml}
                    
                    ${transcriptHtml}

                    <div style="margin-top: 30px; text-align: center;">
                        ${video.youtube_url ? `
                            <a href="${video.youtube_url}" target="_blank" 
                               style="background: var(--accent-primary); color: white; 
                                      padding: 15px 40px; border-radius: 25px; 
                                      text-decoration: none; font-weight: 600;">
                                Watch on YouTube
                            </a>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        modal.style.display = 'block';
    }

    closeModal() {
        const modal = document.getElementById('videoModal');
        if (modal) {
            modal.style.display = 'none';
            // Stop any playing videos
            const iframe = modal.querySelector('iframe');
            if (iframe) iframe.src = '';
        }
    }

    performSearch() {
        const query = document.getElementById('searchInput')?.value.toLowerCase().trim();
        if (!query) return;

        // Search in transcripts
        const results = this.data.transcriptsIndex.filter(item => 
            item.text.toLowerCase().includes(query) ||
            item.title.toLowerCase().includes(query)
        ).slice(0, 10);

        // Search in quotes
        const quoteResults = this.data.quotes.filter(q => 
            q.quote.toLowerCase().includes(query)
        ).slice(0, 5);

        // Search in video titles
        const videoResults = this.data.videos.filter(v => 
            v.title.toLowerCase().includes(query) ||
            (v.summary && v.summary.toLowerCase().includes(query))
        ).slice(0, 5);

        const totalResults = results.length + quoteResults.length + videoResults.length;

        // Show modal with search results
        const modal = document.getElementById('videoModal');
        const body = document.getElementById('modalBody');

        body.innerHTML = `
            <button class="close-modal" onclick="app.closeModal()">&times;</button>
            
            <div style="padding: 30px;">
                <h2 class="modal-title">Search Results</h2>
                <p style="color: var(--text-secondary); margin-bottom: 30px;">
                    Found ${totalResults} result(s) for "${query}"
                </p>

                ${videoResults.length > 0 ? `
                    <h3>Videos</h3>
                    <div style="margin-bottom: 20px;">
                        ${videoResults.map(v => `
                            <div class="card">
                                <h3>${this.truncate(v.title, 80)}</h3>
                                ${v.summary ? `<p>${this.truncate(v.summary, 200)}</p>` : ''}
                                <a href="${v.youtube_url}" target="_blank" style="color: var(--accent-primary);">Watch →</a>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                ${results.length > 0 ? `
                    <h3>Transcript Snippets</h3>
                    <div style="margin-bottom: 20px;">
                        ${results.slice(0, 8).map(r => {
                            const highlighted = r.text.replace(
                                new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
                                '<mark style="background:#7c3aed40;color:#fff;padding:1px 3px;border-radius:3px;">$1</mark>'
                            );
                            const ts = r.timestamp || 0;
                            const mins = Math.floor(ts / 60);
                            const secs = ts % 60;
                            const tsLabel = `${mins}:${String(secs).padStart(2, '0')}`;
                            const ytUrl = r.youtube_url ? `${r.youtube_url}&t=${ts}` : '#';
                            return `
                            <div class="card" style="border-left: 4px solid var(--accent-primary);">
                                <div class="card-body">
                                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                                        <strong style="color:var(--text-primary);">${this.truncate(r.title, 50)}</strong>
                                        <a href="${ytUrl}" target="_blank"
                                           style="color:var(--accent-primary);text-decoration:none;font-family:monospace;font-size:0.9rem;">
                                            ▶ ${tsLabel}
                                        </a>
                                    </div>
                                    <p>${this.truncate(highlighted, 400)}</p>
                                </div>
                            </div>`;
                        }).join('')}
                    </div>
                ` : ''}

                ${quoteResults.length > 0 ? `
                    <h3>Quotes</h3>
                    <div style="margin-bottom: 20px;">
                        ${quoteResults.map(q => `
                            <div class="card" style="border-left: 4px solid var(--accent-primary);">
                                <div class="card-body">
                                    <p style="font-style: italic;">"${q.quote}"</p>
                                    <div style="margin-top: 10px;">${this.truncate(q.title, 50)}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        modal.style.display = 'block';
    }

    showError(message) {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="container">
                    <div class="empty-state" style="padding: 100px; text-align: center;">
                        <div class="empty-state-icon" style="font-size: 5rem;">⚠️</div>
                        <h2 style="color: var(--accent-danger);">Error</h2>
                        <p>${message}</p>
                    </div>
                </div>
            `;
        }
    }

    // Utility functions
    truncate(text, maxLength) {
        if (!text) return '';
        text = String(text);
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength) + '...';
    }

    formatDuration(seconds) {
        if (!seconds || seconds < 0) return '0:00';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    formatDate(dateString) {
        if (!dateString) return '';
        // Handle YYYYMMDD format from yt-dlp
        if (/^\d{8}$/.test(dateString)) {
            const y = dateString.slice(0, 4);
            const m = dateString.slice(4, 6);
            const d = dateString.slice(6, 8);
            dateString = `${y}-${m}-${d}`;
        }
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    }
}

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new AIExchangeApp();

    // Handle hash routing
    window.addEventListener('hashchange', () => {
        const view = window.location.hash.replace('#', '') || 'dashboard';
        if (app) app.renderView(view);
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.id === 'videoModal' && app) {
            app.closeModal();
        }
    });

    // Close modal on Escape key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && app) {
            app.closeModal();
        }
    });
});
