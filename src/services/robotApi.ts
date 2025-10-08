// 机器人控制API服务 - WebSocket 版本
import websocketService from './websocketService';

// 方向映射（中文 -> WebSocket 协议）
const DIRECTION_MAP: Record<string, string> = {
  '前进': 'forward',
  '后退': 'reverse',
  '左转': 'turn_left',
  '右转': 'turn_right',
  '停止': 'pause',  // 滑块复位时调用 pause
};

// 节流控制
let lastCallTime = 0;
const THROTTLE_DELAY = 50; // 50ms

interface RobotResponse {
  code: string;
}

/**
 * 发送机器人控制命令（通过 WebSocket）
 * @param direction 方向（中文）
 * @param speed 速度 0-100
 * @returns Promise<{response: RobotResponse | null, duration: number}>
 */
export async function sendRobotCommand(
  direction: string,
  speed: number
): Promise<{response: RobotResponse | null, duration: number}> {
  // 节流控制
  const now = Date.now();
  if (now - lastCallTime < THROTTLE_DELAY) {
    console.log('请求被节流控制跳过');
    return {response: null, duration: 0};
  }
  lastCallTime = now;

  // 映射方向
  const apiDirection = DIRECTION_MAP[direction] || 'pause';

  const startTime = Date.now();

  // 检查连接状态
  if (!websocketService.getConnectionStatus()) {
    console.error('WebSocket 未连接');
    return {response: null, duration: Date.now() - startTime};
  }

  // 通过 WebSocket 发送命令
  websocketService.sendChassisControl(apiDirection, Math.round(speed));
  const duration = Date.now() - startTime;

  console.log(`发送 WebSocket 命令: ${apiDirection}/${speed}`);

  // WebSocket 是异步的，这里返回一个模拟响应
  return {response: {code: '0000'}, duration};
}

/**
 * 发送电源控制命令（通过 WebSocket）
 * @param isOn true表示开机，false表示关机
 */
export async function sendPowerCommand(isOn: boolean): Promise<{response: RobotResponse | null, duration: number}> {
  const direction = isOn ? 'start' : 'stop';
  const startTime = Date.now();

  // 检查连接状态
  if (!websocketService.getConnectionStatus()) {
    console.error('WebSocket 未连接');
    return {response: null, duration: Date.now() - startTime};
  }

  // 通过 WebSocket 发送命令
  websocketService.sendChassisControl(direction, 0);
  const duration = Date.now() - startTime;

  console.log(`发送 WebSocket 电源命令: ${direction}`);

  // WebSocket 是异步的，这里返回一个模拟响应
  return {response: {code: '0000'}, duration};
}
