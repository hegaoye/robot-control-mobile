import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface CrossDirectionPadProps {
  onDirectionChange: (direction: string, intensity: number) => void;
  className?: string;
  dampingSpeed?: number; // 阻尼速度控制 (0.1-2.0)
}

export const CrossDirectionPad: React.FC<CrossDirectionPadProps> = ({
  onDirectionChange,
  className = '',
  dampingSpeed = 1.0
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isReturning, setIsReturning] = useState(false);
  const padRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  // 计算方向和强度
  const calculateDirectionAndIntensity = useCallback((x: number, y: number) => {
    const distance = Math.sqrt(x * x + y * y);
    const maxDistance = 100; // 增大最大拖拽距离
    const intensity = Math.min(distance / maxDistance * 100, 100);

    // 确定主要方向
    let direction = '停止';
    if (distance > 10) { // 最小移动阈值
      const angle = Math.atan2(-y, x) * 180 / Math.PI; // 负y因为屏幕坐标系y轴向下
      
      if (angle >= -45 && angle < 45) {
        direction = '右转';
      } else if (angle >= 45 && angle < 135) {
        direction = '前进';
      } else if (angle >= 135 || angle < -135) {
        direction = '左转';
      } else {
        direction = '后退';
      }
    }

    return { direction, intensity };
  }, []);

  // 更新位置和方向
  const updatePosition = useCallback((clientX: number, clientY: number) => {
    if (!padRef.current) return;

    const rect = padRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const x = clientX - centerX;
    const y = clientY - centerY;
    
    // 限制在圆形区域内
    const maxDistance = 100; // 与calculateDirectionAndIntensity保持一致
    const distance = Math.sqrt(x * x + y * y);
    
    let newX = x;
    let newY = y;
    
    if (distance > maxDistance) {
      const scale = maxDistance / distance;
      newX = x * scale;
      newY = y * scale;
    }

    setPosition({ x: newX, y: newY });
    
    const { direction, intensity } = calculateDirectionAndIntensity(newX, newY);
    onDirectionChange(direction, intensity);
  }, [calculateDirectionAndIntensity, onDirectionChange]);

  // 阻尼回弹动画
  const returnToCenter = useCallback(() => {
    if (isReturning) return;
    
    setIsReturning(true);
    const startPosition = { ...position };
    const startTime = Date.now();
    const duration = Math.max(200, Math.min(1000, 500 / dampingSpeed)); // 根据dampingSpeed调整持续时间
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 使用缓动函数实现阻尼效果，速度可调
      const easeOut = 1 - Math.pow(1 - progress, 2 + dampingSpeed);
      
      const newX = startPosition.x * (1 - easeOut);
      const newY = startPosition.y * (1 - easeOut);
      
      setPosition({ x: newX, y: newY });
      
      const { direction, intensity } = calculateDirectionAndIntensity(newX, newY);
      onDirectionChange(direction, intensity);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsReturning(false);
        setPosition({ x: 0, y: 0 });
        onDirectionChange('停止', 0);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
  }, [position, isReturning, calculateDirectionAndIntensity, onDirectionChange, dampingSpeed]);

  // 鼠标事件处理 - 只在滑块上响应
  const handleSliderMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡
    setIsDragging(true);
    setIsReturning(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    updatePosition(e.clientX, e.clientY);
  };

  // 触摸事件处理 - 只在滑块上响应
  const handleSliderTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation(); // 阻止事件冒泡
    setIsDragging(true);
    setIsReturning(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    const touch = e.touches[0];
    updatePosition(touch.clientX, touch.clientY);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && !isReturning) {
        updatePosition(e.clientX, e.clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && !isReturning) {
        e.preventDefault();
        const touch = e.touches[0];
        updatePosition(touch.clientX, touch.clientY);
      }
    };

    const handleEnd = () => {
      if (isDragging) {
        setIsDragging(false);
        returnToCenter();
      }
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
  }, [isDragging, isReturning, updatePosition, returnToCenter]);

  // 清理动画
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative w-80 h-80 ${className}`}>
      {/* 主要控制区域 - 放大尺寸 */}
      <div
        ref={padRef}
        className="w-64 h-64 mx-auto bg-slate-700 rounded-full relative select-none"
        style={{
          cursor: 'default', // 背景区域不可点击
          touchAction: 'none',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        {/* 中心圆圈指示器 */}
        <div className="absolute top-1/2 left-1/2 w-20 h-20 bg-slate-600 rounded-full transform -translate-x-1/2 -translate-y-1/2 border-2 border-slate-500"></div>

        {/* 可拖拽的滑块 */}
        <div
          ref={sliderRef}
          onMouseDown={handleSliderMouseDown}
          onTouchStart={handleSliderTouchStart}
          className={`absolute w-14 h-14 bg-blue-500 rounded-full cursor-grab border-2 border-blue-400 shadow-lg ${
            isDragging ? 'cursor-grabbing scale-110 shadow-xl' : ''
          }`}
          style={{
            left: '50%',
            top: '50%',
            transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
            transition: isDragging || isReturning ? 'none' : 'transform 0.2s ease-out, scale 0.2s ease-out',
            zIndex: 10
          }}
        >
          {/* 滑块中心点 */}
          <div className="w-4 h-4 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        {/* 方向轨道线 */}
        <div className="absolute inset-0 pointer-events-none">
          {/* 垂直线 */}
          <div className="absolute left-1/2 top-6 bottom-6 w-0.5 bg-slate-600 transform -translate-x-1/2"></div>
          {/* 水平线 */}
          <div className="absolute top-1/2 left-6 right-6 h-0.5 bg-slate-600 transform -translate-y-1/2"></div>
        </div>
      </div>

    </div>
  );
};