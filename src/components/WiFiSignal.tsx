import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import websocketService from '../services/websocketService';

interface WiFiSignalProps {
  className?: string;
}

export const WiFiSignal: React.FC<WiFiSignalProps> = ({ className = '' }) => {
  const [signalStrength, setSignalStrength] = useState<number>(3); // 0-4 格信号，默认3格
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [latency, setLatency] = useState<number>(0);
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  // 检测网络状态
  useEffect(() => {
    let pingStartTime = 0;

    // 监听 pong 响应
    const handlePong = () => {
      const endTime = performance.now();
      const duration = endTime - pingStartTime;
      setLatency(Math.round(duration));

      // 根据延迟计算信号强度
      if (duration < 100) {
        setSignalStrength(4);
      } else if (duration < 300) {
        setSignalStrength(3);
      } else if (duration < 600) {
        setSignalStrength(2);
      } else {
        setSignalStrength(1);
      }
    };

    // 监听 WebSocket 连接状态变化
    const handleConnectionChange = (connected: boolean) => {
      setWsConnected(connected);
      if (connected) {
        // WebSocket 连接成功后，注册 pong 监听
        const socket = websocketService.socket;
        if (socket) {
          socket.on('pong', handlePong);
        }
      } else {
        setSignalStrength(0);
        setLatency(0);
      }
    };

    const checkNetworkStatus = () => {
      if (!navigator.onLine) {
        setIsOnline(false);
        setSignalStrength(0);
        return;
      }

      setIsOnline(true);

      // 检查 WebSocket 连接状态
      const connected = websocketService.getConnectionStatus();
      setWsConnected(connected);

      if (!connected) {
        setSignalStrength(0);
        setLatency(0);
        return;
      }

      // 通过 WebSocket ping 来测试网络延迟
      pingStartTime = performance.now();

      // 发送 ping 命令
      websocketService.sendPing();
    };

    // 注册连接状态监听
    websocketService.onConnectionChange(handleConnectionChange);

    // 如果已经连接，立即注册 pong 监听
    if (websocketService.getConnectionStatus() && websocketService.socket) {
      websocketService.socket.on('pong', handlePong);
      setWsConnected(true);
    }

    // 立即执行一次检测
    checkNetworkStatus();

    // 每5秒检测一次
    const interval = setInterval(checkNetworkStatus, 5000);

    // 监听在线/离线事件
    const handleOnline = () => {
      setIsOnline(true);
      checkNetworkStatus();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSignalStrength(0);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      websocketService.offConnectionChange(handleConnectionChange);

      // 移除 pong 监听
      const socket = websocketService.socket;
      if (socket) {
        socket.off('pong', handlePong);
      }
    };
  }, []);

  // 获取信号颜色
  const getSignalColor = () => {
    if (!isOnline || signalStrength === 0) return 'text-red-500';
    if (signalStrength <= 1) return 'text-orange-500';
    if (signalStrength <= 2) return 'text-yellow-500';
    return 'text-green-500';
  };

  // 获取信号格颜色
  const getBarColor = () => {
    if (signalStrength === 0 || !isOnline) return '#ef4444'; // 红色
    if (signalStrength <= 1) return '#f97316'; // 橙色
    if (signalStrength <= 2) return '#eab308'; // 黄色
    return '#22c55e'; // 绿色
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {!isOnline || !wsConnected ? (
        <>
          <WifiOff className="w-5 h-5 text-red-500" />
          <span className="text-xs text-red-500">
            {!isOnline ? '离线' : '未连接'}
          </span>
        </>
      ) : (
        <>
          <div className="flex items-end gap-0.5 h-5">
            {[1, 2, 3, 4].map((bar) => (
              <div
                key={bar}
                style={{
                  width: '4px',
                  height: `${bar * 3 + 4}px`,
                  borderRadius: '2px',
                  backgroundColor: bar <= signalStrength ? getBarColor() : '#475569',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
          <span className={`text-xs ${getSignalColor()}`}>
            {latency > 0 ? `${latency}ms` : '检测中'}
          </span>
        </>
      )}
    </div>
  );
};
