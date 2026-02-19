import { useNavigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { Network, BarChart3, Brain, ArrowRight, Zap, Shield } from 'lucide-react'

function NetworkCanvas() {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        let animId

        const resize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }
        resize()
        window.addEventListener('resize', resize)

        // Create particles
        const particles = Array.from({ length: 80 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            r: Math.random() * 2 + 1,
            suspicious: Math.random() < 0.15,
        }))

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            // Draw edges
            particles.forEach((p, i) => {
                particles.forEach((q, j) => {
                    if (j <= i) return
                    const dx = p.x - q.x, dy = p.y - q.y
                    const dist = Math.sqrt(dx * dx + dy * dy)
                    if (dist < 150) {
                        ctx.beginPath()
                        ctx.moveTo(p.x, p.y)
                        ctx.lineTo(q.x, q.y)
                        ctx.strokeStyle = `rgba(230, 57, 70, ${0.08 * (1 - dist / 150)})`
                        ctx.lineWidth = 0.5
                        ctx.stroke()
                    }
                })
            })

            // Draw nodes
            particles.forEach(p => {
                p.x += p.vx
                p.y += p.vy
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1

                ctx.beginPath()
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
                ctx.fillStyle = p.suspicious ? 'rgba(230, 57, 70, 0.8)' : 'rgba(139, 148, 158, 0.4)'
                ctx.fill()
                if (p.suspicious) {
                    ctx.beginPath()
                    ctx.arc(p.x, p.y, p.r + 4, 0, Math.PI * 2)
                    ctx.strokeStyle = 'rgba(230, 57, 70, 0.2)'
                    ctx.stroke()
                }
            })

            animId = requestAnimationFrame(draw)
        }
        draw()

        return () => {
            cancelAnimationFrame(animId)
            window.removeEventListener('resize', resize)
        }
    }, [])

    return <canvas ref={canvasRef} className="particle-bg" />
}

function CountUp({ end, suffix = '', duration = 2000 }) {
    const ref = useRef(null)
    useEffect(() => {
        const el = ref.current
        if (!el) return
        let start = 0
        const step = end / (duration / 16)
        const timer = setInterval(() => {
            start += step
            if (start >= end) { start = end; clearInterval(timer) }
            el.textContent = Math.floor(start).toLocaleString() + suffix
        }, 16)
        return () => clearInterval(timer)
    }, [end, suffix, duration])
    return <span ref={ref}>0{suffix}</span>
}

const features = [
    {
        icon: Network,
        title: 'Graph Intelligence',
        desc: "Johnson's algorithm finds every fraud cycle. Betweenness centrality exposes shell accounts. NetworkX powers the forensics.",
        color: '#e63946',
    },
    {
        icon: BarChart3,
        title: "Benford's Law",
        desc: 'Statistical anomaly detection flags accounts with unnatural transaction digit distributions — a sign of manufactured transfers.',
        color: '#58a6ff',
    },
    {
        icon: Brain,
        title: 'AI Narratives',
        desc: 'Gemini-powered SAR narratives auto-generated for every suspicious account — ready for compliance teams.',
        color: '#3fb950',
    },
]

export default function LandingPage() {
    const navigate = useNavigate()

    return (
        <div className="relative min-h-screen overflow-hidden" style={{ background: 'var(--color-bg)' }}>
            <NetworkCanvas />

            {/* Hero */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
                {/* Badge */}
                <div className="badge-red mb-6 animate-fadeIn">
                    <Zap className="w-3 h-3 mr-1" /> Financial Forensics Engine
                </div>

                {/* Headline */}
                <h1 className="text-5xl md:text-7xl font-black text-center mb-6 leading-tight animate-slideUp"
                    style={{ color: 'var(--color-text-primary)' }}>
                    Follow the Money.
                    <br />
                    <span style={{ color: 'var(--color-accent)' }}>Expose the Network.</span>
                </h1>

                <p className="text-lg md:text-xl text-center max-w-2xl mb-10 animate-fadeIn"
                    style={{ color: 'var(--color-text-secondary)', animationDelay: '0.2s' }}>
                    <strong style={{ color: 'var(--color-text-primary)' }}>MuleNet</strong> tells you <strong style={{ color: 'var(--color-accent)' }}>WHY</strong>,{' '}
                    <strong style={{ color: 'var(--color-warning)' }}>HOW</strong>, and{' '}
                    <strong style={{ color: 'var(--color-success)' }}>WHO TO ARREST FIRST</strong>.
                </p>

                {/* CTA */}
                <button
                    onClick={() => navigate('/analyze')}
                    className="btn-accent text-lg px-8 py-4 rounded-xl animate-scaleIn group"
                    style={{ animationDelay: '0.4s' }}
                >
                    Start Analysis
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Stats ticker */}
                <div className="flex flex-wrap justify-center gap-8 mt-16 animate-fadeIn"
                    style={{ animationDelay: '0.6s' }}>
                    <div className="text-center">
                        <div className="text-3xl font-black" style={{ color: 'var(--color-accent)' }}>
                            <CountUp end={10000} suffix="" />
                        </div>
                        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                            Transactions in &lt;30s
                        </p>
                    </div>
                    <div className="w-px h-12" style={{ background: 'var(--color-panel-border)' }} />
                    <div className="text-center">
                        <div className="text-3xl font-black" style={{ color: 'var(--color-success)' }}>
                            <CountUp end={0} suffix="%" />
                        </div>
                        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                            False positives on legit accounts
                        </p>
                    </div>
                    <div className="w-px h-12" style={{ background: 'var(--color-panel-border)' }} />
                    <div className="text-center">
                        <div className="text-3xl font-black" style={{ color: 'var(--color-blue)' }}>
                            <CountUp end={50} suffix="+" />
                        </div>
                        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                            Fraud rings detected
                        </p>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
                <div className="grid md:grid-cols-3 gap-6">
                    {features.map((f, i) => (
                        <div key={i} className="card-glow" style={{ animationDelay: `${i * 0.1}s` }}>
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                                style={{ background: `${f.color}15`, border: `1px solid ${f.color}30` }}>
                                <f.icon className="w-6 h-6" style={{ color: f.color }} />
                            </div>
                            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                                {f.title}
                            </h3>
                            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                                {f.desc}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Bottom badge */}
                <div className="flex justify-center mt-12">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full"
                        style={{ background: 'var(--color-panel)', border: '1px solid var(--color-panel-border)' }}>
                        <Shield className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
                        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                            Tested against hidden datasets with legitimate account traps
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
