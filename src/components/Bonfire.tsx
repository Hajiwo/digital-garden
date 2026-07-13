import { useEffect, useRef } from 'react'

type Particle = { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number; type: 'flame' | 'spark' | 'smoke' }

export default function Bonfire() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    const width = 170, height = 190, ratio = Math.min(devicePixelRatio || 1, 2)
    canvas.width = width * ratio; canvas.height = height * ratio; context.scale(ratio, ratio)
    const particles: Particle[] = []
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
    let animationFrame = 0, previous = performance.now(), spawnRemainder = 0

    const createParticle = (type: Particle['type']): Particle => {
      const flame = type === 'flame', smoke = type === 'smoke'
      const maxLife = smoke ? 2.5 + Math.random() : flame ? .65 + Math.random() * .75 : .65 + Math.random() * .75
      return { x: width / 2 + (Math.random() - .5) * (smoke ? 32 : 48), y: height - 39 + Math.random() * 9, vx: (Math.random() - .5) * (smoke ? 9 : 18), vy: smoke ? -18 - Math.random() * 13 : flame ? -43 - Math.random() * 48 : -55 - Math.random() * 45, life: maxLife, maxLife, size: smoke ? 17 + Math.random() * 20 : flame ? 10 + Math.random() * 18 : 1 + Math.random() * 1.7, type }
    }

    const drawGround = () => {
      const glow = context.createRadialGradient(width / 2, height - 21, 2, width / 2, height - 21, 72)
      glow.addColorStop(0, 'rgba(255,178,62,.48)'); glow.addColorStop(.24, 'rgba(255,91,16,.22)'); glow.addColorStop(1, 'rgba(255,48,0,0)')
      context.fillStyle = glow; context.beginPath(); context.ellipse(width / 2, height - 20, 76, 23, 0, 0, Math.PI * 2); context.fill()
    }

    const roundedLog = (x: number, y: number, angle: number) => {
      context.save(); context.translate(x, y); context.rotate(angle)
      const bark = context.createLinearGradient(0, -7, 0, 7); bark.addColorStop(0, '#180b07'); bark.addColorStop(.48, '#5c2410'); bark.addColorStop(.7, '#b43d12'); bark.addColorStop(1, '#170906')
      context.fillStyle = bark; context.beginPath(); context.roundRect(-39, -7, 78, 14, 7); context.fill()
      context.strokeStyle = 'rgba(255,118,31,.55)'; context.lineWidth = 1; context.stroke()
      context.restore()
    }

    const drawFuel = () => {
      roundedLog(width / 2, height - 24, .19); roundedLog(width / 2, height - 25, -.2)
      for (let index = 0; index < 13; index++) {
        const angle = index * 2.4, distance = 12 + (index % 4) * 9, x = width / 2 + Math.cos(angle) * distance, y = height - 18 + Math.sin(angle) * distance * .28
        const coal = context.createRadialGradient(x - 2, y - 2, 1, x, y, 8); coal.addColorStop(0, index % 3 ? '#ff9a2e' : '#ffd373'); coal.addColorStop(.35, '#a82b0b'); coal.addColorStop(1, '#160a07')
        context.fillStyle = coal; context.beginPath(); context.ellipse(x, y, 7 + index % 3, 4 + index % 2, angle, 0, Math.PI * 2); context.fill()
      }
    }

    const drawParticle = (particle: Particle) => {
      const age = Math.max(0, particle.life / particle.maxLife)
      context.save(); context.translate(particle.x, particle.y)
      if (particle.type === 'spark') {
        context.globalCompositeOperation = 'lighter'; context.globalAlpha = Math.min(1, age * 1.5); context.fillStyle = '#ffd66b'; context.shadowBlur = 7; context.shadowColor = '#ff4b09'; context.beginPath(); context.arc(0, 0, particle.size, 0, Math.PI * 2); context.fill()
      } else if (particle.type === 'smoke') {
        context.globalAlpha = (1 - age) * age * .11; context.scale(.75, 1.25); const smoke = context.createRadialGradient(0, 0, 0, 0, 0, particle.size); smoke.addColorStop(0, 'rgba(55,45,42,.5)'); smoke.addColorStop(1, 'rgba(35,30,28,0)'); context.fillStyle = smoke; context.beginPath(); context.arc(0, 0, particle.size, 0, Math.PI * 2); context.fill()
      } else {
        context.globalCompositeOperation = 'lighter'; context.globalAlpha = Math.min(1, age * 1.8); context.scale(.55 + age * .16, 1.18)
        const radius = particle.size * (.4 + age * .75), flame = context.createRadialGradient(0, radius * .15, 0, 0, 0, radius)
        flame.addColorStop(0, 'rgba(255,255,220,1)'); flame.addColorStop(.18, 'rgba(255,222,85,.98)'); flame.addColorStop(.48, 'rgba(255,105,12,.82)'); flame.addColorStop(.78, 'rgba(232,24,0,.32)'); flame.addColorStop(1, 'rgba(105,0,0,0)')
        context.fillStyle = flame; context.beginPath(); context.arc(0, 0, radius, 0, Math.PI * 2); context.fill()
      }
      context.restore()
    }

    const render = (now: number) => {
      const delta = Math.min(.034, (now - previous) / 1000); previous = now
      context.clearRect(0, 0, width, height); drawGround(); drawFuel()
      spawnRemainder += delta * 62
      while (spawnRemainder >= 1 && particles.length < 125) { particles.push(createParticle('flame')); spawnRemainder-- }
      if (Math.random() < delta * 11) particles.push(createParticle('spark'))
      if (Math.random() < delta * 5) particles.unshift(createParticle('smoke'))
      for (let index = particles.length - 1; index >= 0; index--) {
        const particle = particles[index]; particle.life -= delta; particle.x += particle.vx * delta + Math.sin(now * .006 + index) * delta * 5; particle.y += particle.vy * delta
        if (particle.type === 'flame') particle.size *= .997
        if (particle.life <= 0) particles.splice(index, 1); else drawParticle(particle)
      }
      if (!reducedMotion) animationFrame = requestAnimationFrame(render)
    }

    if (reducedMotion) { for (let index = 0; index < 38; index++) { const particle = createParticle('flame'); particle.y -= Math.random() * 48; particle.life *= Math.random(); particles.push(particle) } }
    render(previous)
    return () => cancelAnimationFrame(animationFrame)
  }, [])

  return <div className="realistic-bonfire" aria-hidden="true"><canvas ref={canvasRef} /></div>
}
