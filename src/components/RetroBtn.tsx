import React, { useRef, useCallback } from 'react';
import { RetroBtnWrapper } from './styled_components/RetroButtonStyles';

type RetroBtnProps = {
  label?: string;
  onClick?: () => void;
  title?: string;
  disabled?: boolean;
  color?: string;
  size?: string;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

const RetroBtn = ({ label, onClick, title, disabled, color = 'teal', size = 'md', children, className, style }: RetroBtnProps) => {
  const btnRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(() => {
    if (disabled) return;
    const btn = btnRef.current?.querySelector('.btn');
    if (btn) btn.classList.add('btn-active');
  }, [disabled]);

  const handleMouseUp = useCallback(() => {
    const btn = btnRef.current?.querySelector('.btn');
    if (btn) btn.classList.remove('btn-active');
  }, []);

  const handleMouseLeave = useCallback(() => {
    const btn = btnRef.current?.querySelector('.btn');
    if (btn) {
      btn.classList.remove('btn-center', 'btn-right', 'btn-left', 'btn-active');
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    const btn = btnRef.current?.querySelector('.btn') as HTMLElement | null;
    if (!btn) return;
    const leftOffset = btn.getBoundingClientRect().left;
    const btnWidth = btn.offsetWidth;
    const myPosX = e.pageX;
    let newClass = '';
    if (myPosX < (leftOffset + 0.3 * btnWidth)) {
      newClass = 'btn-left';
    } else if (myPosX > (leftOffset + 0.65 * btnWidth)) {
      newClass = 'btn-right';
    } else {
      newClass = 'btn-center';
    }
    const cleared = btn.className.replace(/btn-center|btn-right|btn-left/gi, '').trim();
    btn.className = cleared + ' ' + newClass;
  }, [disabled]);

  return (
      <RetroBtnWrapper
        ref={btnRef}
        $color={color}
        $size={size}
        $disabled={disabled}
        className={className}
        style={style}
        onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      <div
        role="button"
        className="retro-btn"
        onClick={disabled ? undefined : onClick}
        title={title}
      >
        <button className="btn" type="button" disabled={disabled} tabIndex={-1}>
          <span className="btn-inner">
            <span className="content-wrapper">
              <span className="btn-content">
                <span className="btn-content-inner" data-label={label || ''}>
                  {children}
                </span>
              </span>
            </span>
          </span>
        </button>
      </div>
    </RetroBtnWrapper>
  );
};

export default RetroBtn;
