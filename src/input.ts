export class Input {
  keys = new Set<string>();
  x = 0;
  y = 0;
  dash = false;
  pause = false;
  touchX = 0;
  touchY = 0;
  touchId: number | null = null;
  touchOrigin = { x: 0, y: 0 };
  lastInput: 'keyboard' | 'touch' | 'gamepad' = 'keyboard';
  padButtons: boolean[] = [];
  onMenu: ((action: string) => void) | null = null;
  constructor() {
    window.addEventListener('keydown', (e) => {
      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code) &&
        !(e.target instanceof HTMLInputElement)
      )
        e.preventDefault();
      if (e.repeat) return;
      this.lastInput = 'keyboard';
      this.keys.add(e.code);
      if (['Space', 'ShiftLeft', 'ShiftRight'].includes(e.code)) this.dash = true;
      if (e.code === 'Escape' || e.code === 'KeyP') this.pause = true;
      if (['Digit1', 'Digit2', 'Digit3'].includes(e.code)) this.onMenu?.(e.code.slice(-1));
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.reset());
    window.addEventListener('contextmenu', (e) => e.preventDefault());
    const joy = document.getElementById('joystick')!;
    const knob = joy.querySelector<HTMLElement>('.stick-knob')!;
    const start = (e: PointerEvent) => {
      if (this.touchId !== null) return;
      this.lastInput = 'touch';
      this.touchId = e.pointerId;
      joy.setPointerCapture(e.pointerId);
      const r = joy.getBoundingClientRect();
      this.touchOrigin = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      move(e);
    };
    const move = (e: PointerEvent) => {
      if (e.pointerId !== this.touchId) return;
      let x = e.clientX - this.touchOrigin.x,
        y = e.clientY - this.touchOrigin.y;
      const len = Math.hypot(x, y),
        max = 42;
      if (len > max) {
        x = (x / len) * max;
        y = (y / len) * max;
      }
      this.touchX = x / max;
      this.touchY = y / max;
      knob.style.transform = `translate(${x}px, ${y}px)`;
    };
    const end = (e: PointerEvent) => {
      if (e.pointerId !== this.touchId) return;
      this.touchId = null;
      this.touchX = this.touchY = 0;
      knob.style.transform = '';
    };
    joy.addEventListener('pointerdown', start);
    joy.addEventListener('pointermove', move);
    joy.addEventListener('pointerup', end);
    joy.addEventListener('pointercancel', end);
    document.getElementById('touch-dash')!.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.dash = true;
      this.lastInput = 'touch';
    });
  }
  poll() {
    let x = 0,
      y = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x--;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x++;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y--;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y++;
    x += this.touchX;
    y += this.touchY;
    const pad = Array.from(navigator.getGamepads?.() || []).find((p) => p?.connected);
    if (pad) {
      const ax = pad.axes[0] || 0,
        ay = pad.axes[1] || 0;
      if (Math.hypot(ax, ay) > 0.18) {
        x += ax;
        y += ay;
        this.lastInput = 'gamepad';
      }
      if (pad.buttons[14]?.pressed) x--;
      if (pad.buttons[15]?.pressed) x++;
      if (pad.buttons[12]?.pressed) y--;
      if (pad.buttons[13]?.pressed) y++;
      pad.buttons.forEach((b, i) => {
        if (b.pressed && !this.padButtons[i]) {
          this.lastInput = 'gamepad';
          if (i === 0 || i === 5) this.dash = true;
          if (i === 9) this.pause = true;
          if (i === 0) this.onMenu?.('confirm');
          if (i === 1) this.onMenu?.('back');
          if (i === 12 || i === 14) this.onMenu?.('prev');
          if (i === 13 || i === 15) this.onMenu?.('next');
        }
      });
      this.padButtons = pad.buttons.map((b) => b.pressed);
    }
    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    this.x = x;
    this.y = y;
  }
  reset() {
    this.keys.clear();
    this.x = this.y = this.touchX = this.touchY = 0;
    this.touchId = null;
    this.dash = false;
    this.pause = false;
  }
}
