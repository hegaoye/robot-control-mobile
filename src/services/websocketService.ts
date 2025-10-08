// WebSocket 服务模块 - 使用 Socket.IO
import { io, Socket } from 'socket.io-client';

// 服务器地址
const SERVER_URL = 'http://192.168.8.179:8081';

// 事件类型定义
export interface ChassisStatus {
  direction: string;
  speed: number;
  is_running: boolean;
}

export interface ChassisResponse {
  code: string;
  message: string;
  status?: ChassisStatus;
}

export interface ChassisControlData {
  direction: string;
  speed: number;
}

// WebSocket 服务类
class WebSocketService {
  public socket: Socket | null = null; // 公开 socket 供外部访问（用于监听 pong 等事件）
  private isConnected = false;
  private connectionCallbacks: Array<(connected: boolean) => void> = [];
  private statusCallbacks: Array<(status: ChassisStatus) => void> = [];
  private responseCallbacks: Array<(response: ChassisResponse) => void> = [];

  /**
   * 连接到 WebSocket 服务器
   */
  connect(): void {
    if (this.isConnected) return;

    console.log('正在连接到 WebSocket 服务器...');
    this.socket = io(SERVER_URL);

    // 连接成功事件
    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('成功连接到 WebSocket 服务器');
      this.notifyConnectionChange(true);
    });

    // 断开连接事件
    this.socket.on('disconnect', () => {
      this.isConnected = false;
      console.log('与服务器断开连接');
      this.notifyConnectionChange(false);
    });

    // 服务器确认连接
    this.socket.on('connected', (data: { message: string; status?: ChassisStatus }) => {
      console.log('服务器确认连接:', data.message);
      if (data.status) {
        this.notifyStatusUpdate(data.status);
      }
    });

    // 底盘控制响应
    this.socket.on('chassis_response', (data: ChassisResponse) => {
      console.log('底盘控制响应:', data);
      this.notifyResponse(data);
      if (data.status) {
        this.notifyStatusUpdate(data.status);
      }
    });

    // 状态更新
    this.socket.on('status_update', (data: ChassisStatus) => {
      console.log('状态更新:', data);
      this.notifyStatusUpdate(data);
    });

    // 状态查询响应
    this.socket.on('status_response', (data: { status: ChassisStatus }) => {
      console.log('状态查询响应:', data);
      if (data.status) {
        this.notifyStatusUpdate(data.status);
      }
    });

    // 紧急停止响应
    this.socket.on('emergency_stop_response', (data: ChassisResponse) => {
      console.log('紧急停止响应:', data);
      this.notifyResponse(data);
      if (data.status) {
        this.notifyStatusUpdate(data.status);
      }
    });

    // Ping/Pong 心跳响应（用于网络延迟检测）
    this.socket.on('pong', (data: { timestamp: string }) => {
      console.log('心跳响应 pong:', data);
      // pong 事件主要由 WiFiSignal 组件直接监听，这里只做日志记录
    });

    // 连接错误
    this.socket.on('connect_error', (error) => {
      console.error('连接错误:', error);
      this.notifyConnectionChange(false);
    });
  }

  /**
   * 断开 WebSocket 连接
   */
  disconnect(): void {
    if (this.socket && this.isConnected) {
      this.socket.disconnect();
      console.log('手动断开连接');
    }
  }

  /**
   * 发送底盘控制命令
   */
  sendChassisControl(direction: string, speed: number): void {
    if (!this.isConnected || !this.socket) {
      console.error('未连接到服务器');
      return;
    }

    const data: ChassisControlData = {
      direction,
      speed,
    };

    this.socket.emit('chassis_control', data);
    console.log('发送控制命令:', data);
  }

  /**
   * 发送紧急停止命令
   */
  sendEmergencyStop(): void {
    if (!this.isConnected || !this.socket) {
      console.error('未连接到服务器');
      return;
    }

    this.socket.emit('emergency_stop');
    console.log('发送紧急停止命令');
  }

  /**
   * 请求状态更新
   */
  requestStatus(): void {
    if (!this.isConnected || !this.socket) {
      console.error('未连接到服务器');
      return;
    }

    this.socket.emit('get_status');
    console.log('请求状态更新');
  }

  /**
   * 发送 ping 心跳（用于网络延迟检测）
   */
  sendPing(): void {
    if (!this.isConnected || !this.socket) {
      console.error('未连接到服务器，无法发送 ping');
      return;
    }

    this.socket.emit('ping');
  }

  /**
   * 获取连接状态
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * 监听连接状态变化
   */
  onConnectionChange(callback: (connected: boolean) => void): void {
    this.connectionCallbacks.push(callback);
  }

  /**
   * 监听状态更新
   */
  onStatusUpdate(callback: (status: ChassisStatus) => void): void {
    this.statusCallbacks.push(callback);
  }

  /**
   * 监听响应消息
   */
  onResponse(callback: (response: ChassisResponse) => void): void {
    this.responseCallbacks.push(callback);
  }

  /**
   * 移除连接状态监听
   */
  offConnectionChange(callback: (connected: boolean) => void): void {
    this.connectionCallbacks = this.connectionCallbacks.filter((cb) => cb !== callback);
  }

  /**
   * 移除状态更新监听
   */
  offStatusUpdate(callback: (status: ChassisStatus) => void): void {
    this.statusCallbacks = this.statusCallbacks.filter((cb) => cb !== callback);
  }

  /**
   * 移除响应监听
   */
  offResponse(callback: (response: ChassisResponse) => void): void {
    this.responseCallbacks = this.responseCallbacks.filter((cb) => cb !== callback);
  }

  // 通知连接状态变化
  private notifyConnectionChange(connected: boolean): void {
    this.connectionCallbacks.forEach((callback) => callback(connected));
  }

  // 通知状态更新
  private notifyStatusUpdate(status: ChassisStatus): void {
    this.statusCallbacks.forEach((callback) => callback(status));
  }

  // 通知响应消息
  private notifyResponse(response: ChassisResponse): void {
    this.responseCallbacks.forEach((callback) => callback(response));
  }
}

// 创建单例
const websocketService = new WebSocketService();

export default websocketService;
