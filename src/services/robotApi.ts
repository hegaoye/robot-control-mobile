// 机器人控制API服务
const BASE_URL = '/api';

// 方向映射
const DIRECTION_MAP: Record<string, string> = {
  '前进': 'forward',
  '后退': 'reverse',
  '左转': 'turn_left',
  '右转': 'turn_right',
  '停止': 'pause',
};

// 节流控制
let lastCallTime = 0;
const THROTTLE_DELAY = 50; // 100ms

interface RobotResponse {
  code: string;
}

/**
 * 发送机器人控制命令
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
  const apiDirection = DIRECTION_MAP[direction] || 'stop';

  // 构建URL
  const url = `${BASE_URL}/robot/${apiDirection}/${Math.round(speed)}`;

  const startTime = Date.now();
  try {
    console.log(`发送命令: ${url}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: RobotResponse = await response.json();
    const duration = Date.now() - startTime;
    console.log('命令响应:', data);
    return {response: data, duration};
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('发送命令失败:', error);
    return {response: null, duration};
  }
}

/**
 * 发送电源控制命令
 * @param isOn true表示开机，false表示关机
 */
export async function sendPowerCommand(isOn: boolean): Promise<{response: RobotResponse | null, duration: number}> {
  const direction = isOn ? 'start' : 'stop';
  const url = `${BASE_URL}/robot/${direction}/0`;

  const startTime = Date.now();
  try {
    console.log(`发送电源命令: ${url}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: RobotResponse = await response.json();
    const duration = Date.now() - startTime;
    console.log('电源命令响应:', data);
    return {response: data, duration};
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('发送电源命令失败:', error);
    return {response: null, duration};
  }
}
