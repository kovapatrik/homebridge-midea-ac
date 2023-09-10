
export const DISCOVERY_MESSAGE = new Int8Array([
  0x5a, 0x5a, 0x01, 0x11, 0x48, 0x00, 0x92, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x7f, 0x75, 0xbd, 0x6b, 0x3e, 0x4f, 0x8b, 0x76,
  0x2e, 0x84, 0x9c, 0x6e, 0x57, 0x8d, 0x65, 0x90,
  0x03, 0x6e, 0x9d, 0x43, 0x42, 0xa5, 0x0f, 0x1f,
  0x56, 0x9e, 0xb8, 0xec, 0x91, 0x8e, 0x92, 0xe5,
]);

export const DEVICE_INFO_MESSAGE = new Int8Array([
  0x5a, 0x5a, 0x15, 0x00, 0x00, 0x38, 0x00, 0x04,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x27, 0x33, 0x05,
  0x13, 0x06, 0x14, 0x14, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x03, 0xe8, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0xca, 0x8d, 0x9b, 0xf9, 0xa0, 0x30, 0x1a, 0xe3,
  0xb7, 0xe4, 0x2d, 0x53, 0x49, 0x47, 0x62, 0xbe,
]);

export enum DeviceType {
  AIR_CONDITIONER = 0xAC
}

export type DeviceInfo = {
  ip: string;
  port: number;
  id: number;
  model: string;
  sn: string;
  name: string;
  type: number;
  version: number;
};

export enum FrameType {
  UNKNOWN = 0,
  SET = 0x02,
  REQUEST = 0x03,
  RESPONSE = 0x04,
  ABNORMAL_REPORT = 0x06
}

export enum TCPMessageType {
  HANDSHAKE_REQUEST = 0x0,
  HANDSHAKE_RESPONSE = 0x1,
  ENCRYPTED_RESPONSE = 0x3,
  ENCRYPTED_REQUEST = 0x6
}

export enum ProtocolVersion {
  UNKNOWN = 0,
  V1,
  V2,
  V3
}

export type Endianness = 'little' | 'big';