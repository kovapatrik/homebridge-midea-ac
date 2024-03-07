# Air Conditioner

Providing air conditioner settings is optional and the whole section or individual options may be ommitted and default values (noted below) will be used. Within the *devices.config* object the following air conditioner specific options.

```json
"AC_options": {
    "swingMode": "Both",
    "outDoorTemp": false,
    "audioFeedback": false,
    "ecoSwitch": true,
    "switchDisplay": {
        "flag": true,
        "command": false
    },
    "minTemp": 16,
    "maxTemp": 30,
    "tempStep": 1,
    "fahrenheit": false,
    "fanOnlyMode": false
}
```
## Options
- **swingMode** *(optional)*: Set swing mode of the unit. If you AC does not support this feature then leave it on None.
- **outDoorTemp** *(optional)*: Toggles if the outdoor temperature is created with the accessory, default is false.
- **audioFeedback** *(optional)*: Toggles if the unit beeps when a command is sent, default is false.
- **ecoSwitch** *(optional)*: Toggles if the ECO mode switch is created with the accessory, default is true.
- **switchDisplay** *(optional)*: Object with following two options...
- * **flag** *(optional)*: Toggles if a switch, which can turn the display on or off will be created or not. Default is true.
- * **command** *(optional)*: Use this if the switch display command does not work. If it doesn't work either way then you unit does not support this feature. Default is false. 
- **minTemp** *(optional)*: The minimum temperature that the unit can be set for.  Default is 16 celsius
- **maxTemp** *(optional)*: The maximum temperature that the unit can be set for.  Default is 30 celsius
- **tempStep** *(optional)*: Increment in which the temperature setting can be changed, may be set to either 0.5 or 1 degree celsius.  The default is one degree.
- **fahrenheit** *(optional)*: Toggles if the temperature on the unit is displayed in Fahrenheit or Celsius.  Default is false (displays in Celsius).
- **fanOnlyMode** *(optional)*: Toggles if the fan only mode is created with the accessory. Default is false.