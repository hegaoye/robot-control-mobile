import React, { useState, useEffect, useRef } from 'react';
import { Button } from './components/ui/button';
import { Slider } from './components/ui/slider';
import { Textarea } from './components/ui/textarea';
import { CrossDirectionPad } from './components/CrossDirectionPad';
import { WiFiSignal } from './components/WiFiSignal';
import { Power, Square, RotateCcw, Gauge, RotateCw } from 'lucide-react';
import { sendRobotCommand, sendPowerCommand } from './services/robotApi';

interface LogEntry {
  id: number;
  timestamp: string;
  message: string;
}

export default function App() {
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState([50]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [direction, setDirection] = useState('停止');
  const [directionIntensity, setDirectionIntensity] = useState(0);
  const [dampingSpeed, setDampingSpeed] = useState([0.5]);
  const lastLogTimeRef = useRef<number>(0);
  const LOG_THROTTLE_DELAY = 500; // 日志节流延迟 500ms

  const speedPresets = [30, 50, 70, 100];

  const handleSpeedPreset = (speed: number) => {
    setMaxSpeed([speed]);
  };

  const handleMaxSpeedChange = (value: number[]) => {
    setMaxSpeed(value);
    // 当最大速度改变时，如果当前速度超过最大速度，则调整当前速度
    if (currentSpeed > value[0]) {
      setCurrentSpeed(Math.floor(value[0] * 0.8)); // 设置为最大速度的80%
    }
  };

  // 添加日志
  const addLog = (message: string) => {
    const newLog: LogEntry = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
      message
    };
    setLogs(prevLogs => {
      const newLogs = [newLog, ...prevLogs]; // 新日志添加到开头（倒序）
      return newLogs.slice(0, 10); // 保留最多10条
    });
  };

  const handleDirectionChange = async (dir: string, intensity: number) => {
    setDirection(dir);
    setDirectionIntensity(intensity);

    // 根据方向强度和最大速度计算当前速度
    let calculatedSpeed = Math.floor((intensity / 100) * maxSpeed[0]);

    // 如果速度小于10，赋值为0
    if (calculatedSpeed < 10) {
      calculatedSpeed = 0;
    }

    setCurrentSpeed(calculatedSpeed);

    if (dir === '停止') {
      setCurrentSpeed(0);
      setDirectionIntensity(0);
    }

    // 电源状态保护：只有开机状态才发送命令
    if (isRunning) {
      const {response, duration} = await sendRobotCommand(dir, calculatedSpeed);

      // 日志节流控制：避免方向控制时产生过多日志
      const now = Date.now();
      if (response && now - lastLogTimeRef.current >= LOG_THROTTLE_DELAY) {
        lastLogTimeRef.current = now;
        addLog(`请求: /api/robot/${dir}/${calculatedSpeed} - 响应: ${response.code} - 耗时: ${duration}ms`);
      } else if (!response && now - lastLogTimeRef.current >= LOG_THROTTLE_DELAY) {
        lastLogTimeRef.current = now;
        addLog(`请求: /api/robot/${dir}/${calculatedSpeed} - 失败 - 耗时: ${duration}ms`);
      }
    }
  };

  const togglePower = async () => {
    const newState = !isRunning;
    setIsRunning(newState);

    // 发送电源控制命令（只调用 start 或 stop）
    const {response, duration: requestDuration} = await sendPowerCommand(newState);
    if (response) {
      addLog(`电源${newState ? '开启' : '关闭'} - 响应: ${response.code} - 耗时: ${requestDuration}ms`);
    } else {
      addLog(`电源${newState ? '开启' : '关闭'} - 失败 - 耗时: ${requestDuration}ms`);
    }

    if (!newState) {
      // 关机时重置状态，不再发送额外的停止命令
      setCurrentSpeed(0);
      setDirection('停止');
      setDirectionIntensity(0);
    }
  };

  // 旋转控制函数
  const handleRotation = async (rotationType: 'turn_left' | 'turn_right' | 'u_turn') => {
    if (!isRunning) return;

    const direction = rotationType === 'turn_left' ? 'turn_left' : 'turn_right';
    const duration = rotationType === 'u_turn' ? 6000 : 3000; // 掉头6秒，左右转3秒
    const speed = 20;

    // 发送旋转命令
    const {response, duration: requestDuration} = await sendRobotCommand(
      rotationType === 'turn_left' ? '左转' : '右转',
      speed
    );
    if (response) {
      addLog(`${rotationType === 'turn_left' ? '左转90度' : rotationType === 'turn_right' ? '右转90度' : '掉头'} - 速度: ${speed} - 耗时: ${requestDuration}ms`);
    } else {
      addLog(`${rotationType === 'turn_left' ? '左转90度' : rotationType === 'turn_right' ? '右转90度' : '掉头'} - 失败 - 耗时: ${requestDuration}ms`);
    }

    // 设置定时器，在指定时间后自动停止
    setTimeout(async () => {
      const {response: pauseResponse, duration: pauseDuration} = await sendRobotCommand('停止', 0);
      if (pauseResponse) {
        addLog(`自动停止 - 响应: ${pauseResponse.code} - 耗时: ${pauseDuration}ms`);
      } else {
        addLog(`自动停止 - 失败 - 耗时: ${pauseDuration}ms`);
      }
    }, duration);
  };

  // 计算速度比例
  const speedRatio = maxSpeed[0] > 0 ? (currentSpeed / maxSpeed[0]) * 100 : 0;

  return (
    <div className="bg-slate-900 text-white p-4 w-full mx-auto pb-8 pt-safe">

      {/* 十字方向控制区域 - 占满宽度 */}
      <div className="bg-slate-800 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm text-slate-300">方向控制</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-blue-400" />
              <span className="text-2xl font-medium text-blue-400">{currentSpeed}</span>
              <span className="text-sm text-slate-400">HZ</span>
            </div>
            <WiFiSignal />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={togglePower}
            className={`rounded-full w-10 h-10 p-0 ${isRunning ? 'bg-blue-500 hover:bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}
          >
            <Power className="w-5 h-5" />
          </Button>
        </div>

        {/* 旋转控制按钮 */}
        <div className="flex gap-4 justify-center mb-6">
          <Button
            onClick={() => handleRotation('turn_left')}
            disabled={!isRunning}
            className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700/50 disabled:text-slate-500 text-xs px-4 py-6 h-auto"
          >
            <div className="flex items-center gap-1">
              <RotateCcw className="w-4 h-4" />
              <span>左转90°</span>
            </div>
          </Button>
          <Button
            onClick={() => handleRotation('turn_right')}
            disabled={!isRunning}
            className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700/50 disabled:text-slate-500 text-xs px-4 py-6 h-auto"
          >
            <div className="flex items-center gap-1">
              <RotateCw className="w-4 h-4" />
              <span>右转90°</span>
            </div>
          </Button>
          <Button
            onClick={() => handleRotation('u_turn')}
            disabled={!isRunning}
            className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700/50 disabled:text-slate-500 text-xs px-4 py-6 h-auto"
          >
            <div className="flex items-center gap-1">
              <RotateCcw className="w-4 h-4" />
              <span>掉头</span>
            </div>
          </Button>
        </div>

        <div className="flex justify-center mb-6">
          <CrossDirectionPad
            onDirectionChange={handleDirectionChange}
            dampingSpeed={dampingSpeed[0]}
          />
        </div>

        {/* 阻尼速度控制 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">滑块阻尼</span>
            <span className="text-xs text-blue-400">{dampingSpeed[0].toFixed(1)}x</span>
          </div>
          <Slider
            value={dampingSpeed}
            onValueChange={setDampingSpeed}
            max={1.0}
            min={0.2}
            step={0.1}
            className="w-full [&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
          />
        </div>

        {/* 速度设置 */}
        <div>
          <h3 className="text-sm text-slate-300 mb-3">速度设置</h3>
          <div className="mb-4">
            <Slider
              value={maxSpeed}
              onValueChange={handleMaxSpeedChange}
              max={100}
              min={0}
              step={10}
              className="w-full"
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {speedPresets.map((speed) => (
              <Button
                key={speed}
                variant="ghost"
                size="sm"
                className={`text-xs py-2 transition-all duration-200 ${
                  maxSpeed[0] === speed
                    ? 'bg-blue-500 hover:bg-blue-600 scale-105'
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}
                onClick={() => handleSpeedPreset(speed)}
              >
                {speed} HZ
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* 日志显示区域 */}
      <div className="mb-6">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 className="text-sm text-slate-300 mb-3">日志</h3>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-slate-500 text-sm text-center py-4">暂无日志</div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={log.id}
                  className="text-sm font-mono"
                  style={{
                    color: index < 3 ? 'white' : 'rgba(226, 232, 240, 0.6)' // 前3条白色，后面浅灰色
                  }}
                >
                  <span className="text-slate-500">[{log.timestamp}]</span> {log.message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 底部���全区域 */}
      <div className="pb-safe"></div>
    </div>
  );
}