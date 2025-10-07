import React, { useState, useRef, useCallback, useEffect } from 'react';

interface DraggableSliderProps {
  direction: 'vertical' | 'horizontal';
  value: number; // 0-100
  onChange: (value: number) => void;
  onDirectionChange: (direction: string) => void;
  trackClassName?: string;
  sliderClassName?: string;
  isActive?: boolean;
  currentDirection?: string;
}

export const DraggableSlider: React.FC<DraggableSliderProps> = ({
  direction,
  value,
  onChange,
  onDirectionChange,
  trackClassName = '',
  sliderClassName = '',
  isActive = false,
  currentDirection = '停止'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const updateValue = useCallback((clientX: number, clientY: number) => {
    if (!trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    let newValue: number;
    let dir: string;

    if (direction === 'vertical') {
      const centerY = rect.top + rect.height / 2;
      const relativeY = clientY - centerY;
      const maxDistance = rect.height / 2 - 20; // 减去滑块半径
      
      // 限制范围
      const clampedY = Math.max(-maxDistance, Math.min(maxDistance, relativeY));
      
      // 确定方向和数值
      if (Math.abs(clampedY) < 10) {
        dir = '停止';
        newValue = 0;
      } else if (clampedY < 0) {
        dir = '前进';
        newValue = Math.abs(clampedY / maxDistance) * 100;
      } else {
        dir = '后退';
        newValue = Math.abs(clampedY / maxDistance) * 100;
      }
    } else {
      const centerX = rect.left + rect.width / 2;
      const relativeX = clientX - centerX;
      const maxDistance = rect.width / 2 - 20; // 减去滑块半径
      
      // 限制范围
      const clampedX = Math.max(-maxDistance, Math.min(maxDistance, relativeX));
      
      // 确定方向和数值
      if (Math.abs(clampedX) < 10) {
        dir = '停止';
        newValue = 0;
      } else if (clampedX < 0) {
        dir = '左转';
        newValue = Math.abs(clampedX / maxDistance) * 100;
      } else {
        dir = '右转';
        newValue = Math.abs(clampedX / maxDistance) * 100;
      }
    }

    onChange(newValue);
    onDirectionChange(dir);
  }, [direction, onChange, onDirectionChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updateValue(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    const touch = e.touches[0];
    updateValue(touch.clientX, touch.clientY);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        updateValue(e.clientX, e.clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        e.preventDefault();
        const touch = e.touches[0];
        updateValue(touch.clientX, touch.clientY);
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, updateValue]);

  // 计算滑块位置 - 基于当前方向和值
  const getSliderPosition = () => {
    if (direction === 'vertical') {
      const maxDistance = 40; // 轨道长度的一半减去滑块半径
      let translateY = 0;
      
      // 根据当前方向确定位置
      if (currentDirection === '前进') {
        translateY = -(value / 100) * maxDistance;
      } else if (currentDirection === '后退') {
        translateY = (value / 100) * maxDistance;
      }
      
      return {
        transform: `translateY(${translateY}px)`,
        transition: isDragging ? 'none' : 'transform 0.2s ease-out'
      };
    } else {
      const maxDistance = 40; // 轨道长度的一半减去滑块半径
      let translateX = 0;
      
      // 根据当前方向确定位置
      if (currentDirection === '左转') {
        translateX = -(value / 100) * maxDistance;
      } else if (currentDirection === '右转') {
        translateX = (value / 100) * maxDistance;
      }
      
      return {
        transform: `translateX(${translateX}px)`,
        transition: isDragging ? 'none' : 'transform 0.2s ease-out'
      };
    }
  };

  return (
    <div
      ref={trackRef}
      className={`relative bg-slate-700 ${
        direction === 'vertical' 
          ? 'w-16 h-32 rounded-full' 
          : 'w-32 h-16 rounded-full'
      } ${trackClassName}`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <div
        ref={sliderRef}
        className={`absolute w-10 h-10 bg-blue-500 rounded-full cursor-grab ${
          isDragging ? 'cursor-grabbing scale-110' : ''
        } ${sliderClassName}`}
        style={{
          ...getSliderPosition(),
          top: direction === 'vertical' ? '50%' : '50%',
          left: direction === 'vertical' ? '50%' : '50%',
          marginTop: direction === 'vertical' ? '-20px' : '-20px',
          marginLeft: direction === 'vertical' ? '-20px' : '-20px',
        }}
        data-direction={currentDirection}
      >
        <div className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>
    </div>
  );
};