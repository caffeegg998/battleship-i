import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

const ConfettiCanvas = styled.canvas`
  height: 100vh;
  pointer-events: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 10000;
`;

const Confetti = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const confettiCount = 60;
    const sequinCount = 30;
    const gravityConfetti = 0.3;
    const gravitySequins = 0.55;
    const dragConfetti = 0.075;
    const dragSequins = 0.02;
    const terminalVelocity = 3;

    const colors = [
      { front: '#7b5cff', back: '#6245e0' }, // Purple
      { front: '#b3c7ff', back: '#8fa5e5' }, // Light Blue
      { front: '#5c86ff', back: '#345dd1' }, // Darker Blue
      { front: '#ffd700', back: '#b8860b' }, // Gold
    ];

    const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const initConfettoVelocity = (xRange: [number, number], yRange: [number, number]) => {
      const x = randomRange(xRange[0], xRange[1]);
      const range = yRange[1] - yRange[0] + 1;
      let y = yRange[1] - Math.abs(randomRange(0, range) + randomRange(0, range) - range);
      if (y >= yRange[1] - 1) {
        y += Math.random() < 0.25 ? randomRange(1, 3) : 0;
      }
      return { x: x, y: -y };
    };

    class Confetto {
      randomModifier = randomRange(0, 99);
      color = colors[Math.floor(randomRange(0, colors.length))];
      dimensions = { x: randomRange(5, 9), y: randomRange(8, 15) };
      position = { x: randomRange(0, canvas!.width), y: randomRange(-20, -100) };
      rotation = randomRange(0, 2 * Math.PI);
      scale = { x: 1, y: 1 };
      velocity = initConfettoVelocity([-5, 5], [3, 10]);

      update() {
        this.velocity.x -= this.velocity.x * dragConfetti;
        this.velocity.y = Math.min(this.velocity.y + gravityConfetti, terminalVelocity);
        this.velocity.x += Math.random() > 0.5 ? Math.random() : -Math.random();
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        this.scale.y = Math.cos((this.position.y + this.randomModifier) * 0.09);
      }
    }

    class Sequin {
      color = colors[Math.floor(randomRange(0, colors.length))].back;
      radius = randomRange(1, 2);
      position = { x: randomRange(0, canvas!.width), y: randomRange(-20, -100) };
      velocity = { x: randomRange(-3, 3), y: randomRange(2, 6) };

      update() {
        this.velocity.x -= this.velocity.x * dragSequins;
        this.velocity.y = this.velocity.y + gravitySequins;
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
      }
    }

    let confetti: Confetto[] = [];
    let sequins: Sequin[] = [];

    const addBatch = () => {
      for (let i = 0; i < confettiCount; i++) confetti.push(new Confetto());
      for (let i = 0; i < sequinCount; i++) sequins.push(new Sequin());
    };

    addBatch();

    let animationId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      confetti.forEach((confetto, index) => {
        let width = confetto.dimensions.x * confetto.scale.x;
        let height = confetto.dimensions.y * confetto.scale.y;
        ctx.translate(confetto.position.x, confetto.position.y);
        ctx.rotate(confetto.rotation);
        confetto.update();
        ctx.fillStyle = confetto.scale.y > 0 ? confetto.color.front : confetto.color.back;
        ctx.fillRect(-width / 2, -height / 2, width, height);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      });

      sequins.forEach((sequin) => {
        ctx.translate(sequin.position.x, sequin.position.y);
        sequin.update();
        ctx.fillStyle = sequin.color;
        ctx.beginPath();
        ctx.arc(0, 0, sequin.radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      });

      confetti = confetti.filter((c) => c.position.y < canvas.height);
      sequins = sequins.filter((s) => s.position.y < canvas.height);

      if (confetti.length > 0 || sequins.length > 0) {
        animationId = window.requestAnimationFrame(render);
      }
    };

    render();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.cancelAnimationFrame(animationId);
    };
  }, []);

  return <ConfettiCanvas ref={canvasRef} />;
};

export default Confetti;
