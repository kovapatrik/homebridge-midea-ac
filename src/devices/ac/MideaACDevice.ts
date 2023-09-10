import { Logger } from 'homebridge';
import { DeviceInfo } from '../../core/MideaConstants';
import MideaDevice, { DeviceAttributesBase } from '../../core/MideaDevice';
import { KeyToken } from '../../core/MideaSecurity';
import { MessageACResponse, MessageGeneralSet, MessageNewProtocolQuery, MessageNewProtocolSet, MessagePowerQuery, MessageQuery, MessageSubProtocol, MessageSubProtocolQuery, MessageSubProtocolSet, MessageSwitchDisplay } from './MideaACMessage';

interface DeviceAttributes extends DeviceAttributesBase {
  PROMPT_TONE: boolean;
  POWER: boolean;
  // OFF, AUTO, COOL, DRY, HEAT, FAN_ONLY
  MODE: number;
  TARGET_TEMPERATURE: number;
  FAN_SPEED: number;
  SWING_VERTICAL: boolean;
  SWING_HORIZONTAL: boolean;
  SMART_EYE: boolean;
  DRY: boolean;
  AUX_HEATING: boolean;
  BOOST_MODE: boolean;
  SLEEP_MODE: boolean;
  FROST_PROTECT: boolean;
  COMFORT_MODE: boolean;
  ECO_MODE: boolean;
  NATURAL_WIND: boolean;
  TEMP_FAHRENHEIT: boolean;
  SCREEN_DISPLAY: boolean;
  SCREEN_DISPLAY_NEW: boolean;
  FULL_DUST: boolean;
  INDOOR_TEMPERATURE?: number;
  OUTDOOR_TEMPERATURE?: number;
  INDIRECT_WIND: boolean;
  INDOOR_HUMIDITY?: number;
  BREEZELESS: boolean;
  TOTAL_ENERGY_CONSUMPTION?: number;
  CURRENT_ENERGY_CONSUMPTION?: number;
  REALTIME_POWER: number;
  FRESH_AIR_POWER: boolean;
  FRESH_AIR_FAN_SPEED: number;
  FRESH_AIR_MODE?: string;
  FRESH_AIR_1: boolean;
  FRESH_AIR_2: boolean;
}

export default class MideaACDevice extends MideaDevice {

  readonly FRESH_AIR_FAN_SPEEDS = {
    0: 'Off',
    20: 'Silent',
    40: 'Low',
    60: 'Medium',
    80: 'High',
    100: 'Full',
  };

  readonly FRESH_AIR_FAN_SPEEDS_REVERSE = {
    100: 'Full',
    80: 'High',
    60: 'Medium',
    40: 'Low',
    20: 'Silent',
    0: 'Off',
  };

  public attributes: DeviceAttributes;

  private fresh_air_version?: number;
  private readonly DEFAULT_TEMPERATURE_STEP = 0.5;
  private temperature_step?: number;
  private used_subprotocol = false;
  private bb_sn8_flag = false;
  private bb_timer = false;
  private readonly DEFAULT_POWER_ANALYSIS_METHOD = 2;
  private power_analysis_method?: number;

  constructor(
    logger: Logger,
    device_info: DeviceInfo,
    token: KeyToken,
    key: KeyToken,
  ) {
    super(logger, device_info, token, key);
    this.attributes = {
      PROMPT_TONE: false,
      POWER: false,
      MODE: 0,
      TARGET_TEMPERATURE: 24.0,
      FAN_SPEED: 102,
      SWING_VERTICAL: false,
      SWING_HORIZONTAL: false,
      SMART_EYE: false,
      DRY: false,
      AUX_HEATING: false,
      BOOST_MODE: false,
      SLEEP_MODE: false,
      FROST_PROTECT: false,
      COMFORT_MODE: false,
      ECO_MODE: false,
      NATURAL_WIND: false,
      TEMP_FAHRENHEIT: false,
      SCREEN_DISPLAY: false,
      SCREEN_DISPLAY_NEW: false,
      FULL_DUST: false,
      INDIRECT_WIND: false,
      BREEZELESS: false,
      REALTIME_POWER: 0,
      FRESH_AIR_POWER: false,
      FRESH_AIR_FAN_SPEED: 0,
      FRESH_AIR_1: false,
      FRESH_AIR_2: false,
    };
  }

  build_query() {
    if (this.used_subprotocol) {
      return [
        new MessageSubProtocolQuery(this.version, 0x10),
        new MessageSubProtocolQuery(this.version, 0x11),
        new MessageSubProtocolQuery(this.version, 0x30),
      ];
    }
    return [
      new MessageQuery(this.version),
      new MessageNewProtocolQuery(this.version),
      new MessagePowerQuery(this.version),
    ];
  }

  process_message(msg: Buffer) {
    const message = new MessageACResponse(msg, this.power_analysis_method);
    this.logger.debug(`[${this.id}] Got message: ${message.toString()}`);
    let has_fresh_air = false;
    const new_status: Partial<DeviceAttributes> = {};

    if (message.used_subprotocol) {
      this.used_subprotocol = true;
      if (message.get_body_attribute('sn8_flag')) {
        this.bb_sn8_flag = message.get_body_attribute('sn8_flag');
      }
      if (message.get_body_attribute('timer')) {
        this.bb_timer = message.get_body_attribute('timer');
      }
    }


    for (const status of Object.keys(this.attributes)) {
      if (message.get_body_attribute(status)) {
        const value = message.get_body_attribute(status);
        if (status === 'FRESH_AIR_POWER') {
          has_fresh_air = true;
        }
        this.attributes[status] = value;
        new_status[status] = value;
      }
    }

    if (has_fresh_air) {
      if (this.attributes.FRESH_AIR_POWER) {
        for (const [k, v] of Object.entries(this.FRESH_AIR_FAN_SPEEDS_REVERSE)) {
          if (this.attributes.FRESH_AIR_FAN_SPEED > Number.parseInt(k)) {
            break;
          } else {
            this.attributes.FRESH_AIR_MODE = v;
          }
        }
      } else {
        this.attributes.FRESH_AIR_MODE = 'Off';
      }
      new_status['FRESH_AIR_MODE'] = this.attributes.FRESH_AIR_MODE;
    }

    if (!this.attributes.POWER || (Object.keys(new_status).includes('SWING_VERTICAL') && this.attributes.SWING_VERTICAL)) {
      this.attributes.INDIRECT_WIND = false;
      new_status['INDIRECT_WIND'] = false;
    }
    if (!this.attributes.POWER) {
      this.attributes.SCREEN_DISPLAY = false;
      new_status['SCREEN_DISPLAY'] = false;
    }
    if (this.attributes.FRESH_AIR_1) {
      this.fresh_air_version = 1;
    } else if (this.attributes.FRESH_AIR_2) {
      this.fresh_air_version = 2;
    }
    return new_status;
  }

  make_message_set() {
    const message = new MessageGeneralSet(this.version);
    message.power = this.attributes.POWER;
    message.prompt_tone = this.attributes.PROMPT_TONE;
    message.mode = this.attributes.MODE;
    message.target_temperature = this.attributes.TARGET_TEMPERATURE;
    message.fan_speed = this.attributes.FAN_SPEED;
    message.swing_vertical = this.attributes.SWING_VERTICAL;
    message.swing_horizontal = this.attributes.SWING_HORIZONTAL;
    message.boost_mode = this.attributes.BOOST_MODE;
    message.smart_eye = this.attributes.SMART_EYE;
    message.dry = this.attributes.DRY;
    message.eco_mode = this.attributes.ECO_MODE;
    message.aux_heating = this.attributes.AUX_HEATING;
    message.sleep_mode = this.attributes.SLEEP_MODE;
    message.frost_protect = this.attributes.FROST_PROTECT;
    message.comfort_mode = this.attributes.COMFORT_MODE;
    message.natural_wind = this.attributes.NATURAL_WIND;
    message.temp_fahrenheit = this.attributes.TEMP_FAHRENHEIT;
    return message;
  }

  make_subprotocol_message_set() {
    const message = new MessageSubProtocolSet(this.version);
    message.power = this.attributes.POWER;
    message.prompt_tone = this.attributes.PROMPT_TONE;
    message.aux_heating = this.attributes.AUX_HEATING;
    message.mode = this.attributes.MODE;
    message.target_temperature = this.attributes.TARGET_TEMPERATURE;
    message.fan_speed = this.attributes.FAN_SPEED;
    message.boost_mode = this.attributes.BOOST_MODE;
    message.dry = this.attributes.DRY;
    message.eco_mode = this.attributes.ECO_MODE;
    message.sleep_mode = this.attributes.SLEEP_MODE;
    message.sn8_flag = this.bb_sn8_flag;
    message.timer = this.bb_timer;
    return message;
  }

  make_message_unique_set(): MessageGeneralSet | MessageSubProtocolSet {
    return this.used_subprotocol ? this.make_subprotocol_message_set() : this.make_message_set();
  }

  async set_attribute(attributes: Partial<DeviceAttributes>) {
    for (const [k, v] of Object.entries(attributes)) {

      let message: MessageGeneralSet | MessageSubProtocolSet | MessageNewProtocolSet | undefined = undefined;

      // not sensor data
      if (!['INDOOR_TEMPERATURE', 'OUTDOOR_TEMPERATURE', 'INDOOR_HUMIDITY', 'FULL_DUST',
        'TOTAL_ENERGY_CONSUMPTION', 'CURRENT_ENERGY_CONSUMPTION', 'REALTIME_POWER'].includes(k)) {

        if (k === 'PROMPT_TONE') {
          this.attributes.PROMPT_TONE = v as boolean;
        } else if (k === 'SCREEN_DISPAY') {
          if (this.attributes.SCREEN_DISPLAY_NEW) {
            message = new MessageNewProtocolSet(this.version);
            message.screen_display = v as boolean;
            message.prompt_tone = this.attributes.PROMPT_TONE;
          } else {
            message = new MessageSwitchDisplay(this.version);
          }
        } else if (['INDIRECT_WIND', 'BREEZELESS'].includes(k)) {
          message = new MessageNewProtocolSet(this.version);
          message[k.toLowerCase()] = v as boolean;
          message.prompt_tone = this.attributes.PROMPT_TONE;
        } else if (k === 'FRESH_AIR_POWER') {
          if (this.fresh_air_version) {
            message = new MessageNewProtocolSet(this.version);
            message[this.fresh_air_version] = [v as boolean, this.attributes.FRESH_AIR_FAN_SPEED];
          }
        } else if (k === 'FRESH_AIR_MODE' && this.fresh_air_version) {
          if (Object.values(this.FRESH_AIR_FAN_SPEEDS).includes(v as string)) {
            const speed = Number.parseInt(Object.keys(this.FRESH_AIR_FAN_SPEEDS).find(key => this.FRESH_AIR_FAN_SPEEDS[key] === v)!);
            const fresh_air = speed > 0 ? [true, speed] : [false, this.attributes.FRESH_AIR_FAN_SPEED];
            message = new MessageNewProtocolSet(this.version);
            message[this.fresh_air_version] = fresh_air;
          } else if (!v) {
            message = new MessageNewProtocolSet(this.version);
            message[this.fresh_air_version] = [false, this.attributes.FRESH_AIR_FAN_SPEED];
          }
        } else if (k === 'FRESH_AIR_FAN_SPEED' && this.fresh_air_version) {
          message = new MessageNewProtocolSet(this.version);
          const value = v as number;
          const fresh_air = value > 0 ? [true, value] : [false, this.attributes.FRESH_AIR_FAN_SPEED];
          message[this.fresh_air_version] = fresh_air;
        } else {
          message = this.make_message_unique_set() ;
          if (['BOOST_MODE', 'SLEEP_MODE', 'FROST_PROTECT', 'COMFORT_MODE', 'ECO_MODE'].includes(k)) {
            if (message instanceof MessageGeneralSet || message instanceof MessageSubProtocolSet) {
              message.sleep_mode = false;
              message.boost_mode = false;
              message.eco_mode = false;

              if (message instanceof MessageGeneralSet) {
                message.frost_protect = false;
                message.comfort_mode = false;
              }
              message[k.toLowerCase()] = v as boolean;
              if (k === 'MODE') {
                message.power = true;
              }
            }
          }
        }
      }
      if (message) {
        await this.build_send(message);
      }
    }
  }

  set_target_temperature(target_temperature: number, mode: number) {
    const message = this.make_message_unique_set();
    message.target_temperature = target_temperature;
    if (mode) {
      message.mode = mode;
      message.power = true;
    }
    this.build_send(message);
  }

  set_swing(swing_horizontal: boolean, swing_vertical: boolean) {
    const message = this.make_message_set();
    message.swing_horizontal = swing_horizontal;
    message.swing_vertical = swing_vertical;
    this.build_send(message);
  }

  protected set_subtype(): void {
    throw new Error('Method not implemented.');
  }
}